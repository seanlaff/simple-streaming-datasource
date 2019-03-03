import moment from 'moment';
import * as ndjsonStream from './vendor/ndjson.js';
import * as rxjs from './vendor/rxjs.umd.min.js';

// We return a StreamHandler wrapped in a promise from the datasource's
// Query method. Grafana expects this object to have a `subscribe` method,
// which it knows how to read live data from.
export class StreamHandler {
  constructor(options, datasource) {
    this.options = options;
    this.ds = datasource;
    this.subject = new rxjs.Subject();
    this.subscribe = options => {
      // To avoid destroying the browser with repaints, add a throttle
      var throttledSubject = this.subject.pipe(rxjs.operators.throttleTime(1000));
      return throttledSubject.subscribe(options);
    };
    this.reader = null;
    this.metrics = {};
  }

  open() {
    var request = new Request(`${this.ds.url}`);
    fetch(request)
      .then(response => {
        // In the real world its likely that our json gets chopped into
        // chunks when streamed from the backend. ndjsonStream handles
        // reconstructing the newline-delimmited json for us.
        return ndjsonStream.default(response.body);
      })
      .then(s => {
        this.reader = s.getReader(); // Save the reader so we can cancel it later
        let read; //handler

        this.reader.read().then(
          (read = result => {
            if (result.done) {
              return;
            }

            this.handleMessage(result.value);

            this.reader.read().then(read);
          })
        );
      });
  }

  handleMessage(msg) {
    const seriesList = [];
    let oldestTimeMS;
    let earliestTimeMS = this.options.range.from.unix() * 1000;

    var indicator = {
      target: msg.series,
      datapoints: [],
    };

    oldestTimeMS = msg.timestamp;
    indicator.datapoints.push([msg.value, msg.timestamp]);

    let series = this.metrics[indicator.target];
    if (!series) {
      series = { target: indicator.target, datapoints: [] };
      this.metrics[indicator.target] = series;
    }
    series.datapoints = [...series.datapoints, ...indicator.datapoints];

    // Slide the "window" and remove older points
    series.datapoints = series.datapoints.filter(
      p => p[1] > oldestTimeMS - (this.options.range.to.unix() * 1000 - this.options.range.from.unix() * 1000)
    );
    if (series.datapoints[0] && series.datapoints[0][1] && series.datapoints[0][1] > earliestTimeMS) {
      earliestTimeMS = series.datapoints[0][1];
    }
    seriesList.push(series);

    const ts = Object.keys(this.metrics).map(key => {
      return this.metrics[key];
    });

    this.subject.next({
      data: ts,
      range: { from: moment(earliestTimeMS), to: moment(oldestTimeMS) },
    });
  }

  close() {
    if (this.reader) {
      this.reader.cancel('Close was called on streamHandler');
    }
  }
}
