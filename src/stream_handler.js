import moment from 'moment';
import * as ndjsonStream from './vendor/ndjson.js';
import * as rxjs from './vendor/rxjs.umd.min.js';

// We return a StreamHandler wrapped in a promise from the datasource's
// Query method. Grafana expects this object to have a `subscribe` method,
// which it reads live data from.
export class StreamHandler {
  constructor(options, datasource) {
    this.options = options;
    this.ds = datasource;
    this.subject = new rxjs.Subject(); // Where we'll publish our data
    this.subscribe = options => {
      // To avoid destroying the browser with repaints, add a throttle (You may want to tweak this)
      var throttledSubject = this.subject.pipe(rxjs.operators.throttleTime(100));
      return throttledSubject.subscribe(options);
    };
    this.reader = null;
    this.metrics = {}; // A local copy of our data that we'll operate on before sending to the rxjs Subject
  }

  open() {
    var request = new Request(`${this.ds.url}?numSeries=${this.options.targets[0].numSeries}`);
    fetch(request)
      .then(response => {
        // In the real world its likely that our json gets chopped into
        // chunks when streamed from the backend. ndjsonStream handles
        // reconstructing the newline-delimmited json for us.
        return ndjsonStream.default(response.body);
      })
      .then(s => {
        this.reader = s.getReader(); // Save the reader so we can cancel it later
        let readHandler;

        this.reader.read().then(
          (readHandler = result => {
            if (result.done) {
              return;
            }
            this.handleMessage(result.value);
            this.reader.read().then(readHandler);
          })
        );
      });
  }

  handleMessage(msg) {
    let oldestTimestamp = this.options.range.from.unix() * 1000;
    var mostRecentTimestamp = this.options.range.to.unix() * 1000;

    // Assuming the data we're being streamed in chronologically ordered
    if (msg.timestamp > mostRecentTimestamp) {
      mostRecentTimestamp = msg.timestamp;
    }

    // See if we have any data already for this target
    let series = this.metrics[msg.series];
    if (!series) {
      series = { target: msg.series, datapoints: [] };
      this.metrics[msg.series] = series;
    }
    series.datapoints = [...series.datapoints, [msg.value, msg.timestamp]]; // Add our new point to the end

    // Slide the "window" by removing any points that are older than the latest point,
    // minus the width of the current time range
    series.datapoints = series.datapoints.filter(
      p => p[1] > mostRecentTimestamp - (this.options.range.to.unix() * 1000 - this.options.range.from.unix() * 1000)
    );

    // Grab the timestamp of the earliest point still in the datapoints array, we'll
    // move the time window forward to match it
    if (series.datapoints[0] && series.datapoints[0][1] && series.datapoints[0][1] > oldestTimestamp) {
      oldestTimestamp = series.datapoints[0][1];
    }

    const ts = Object.keys(this.metrics).map(key => {
      return this.metrics[key];
    });

    this.subject.next({
      data: ts,
      range: { from: moment(oldestTimestamp), to: moment(mostRecentTimestamp) },
    });
  }

  close() {
    if (this.reader) {
      this.reader.cancel('Close was called on streamHandler');
    }
  }
}
