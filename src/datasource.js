import _ from 'lodash';
import * as ndjsonStream from './vendor/ndjson.js';
import * as rxjs from './vendor/rxjs.umd.min.js';
import moment from 'moment';
export class StreamingDatasource {
  constructor(instanceSettings, $q) {
    this.url = instanceSettings.url;
    this.q = $q;
    this.headers = { 'Content-Type': 'application/json' };
  }

  query(options) {
    var subject = new rxjs.Subject();
    var metrics = {};

    var request = new Request(`${this.url}`);

    fetch(request)
      .then(response => {
        // In this toy example we're sending small json that doesn't get split...
        // but its possible that your backend may serve chunks of newline-delimmited
        // json. In that case, you'll want to use something like ndjsonStream
        // to stitch the json together
        return ndjsonStream.default(response.body);
      })
      .then(s => {
        const reader = s.getReader();
        let read;
        reader.read().then(
          (read = result => {
            if (result.done) {
              return;
            }
            const seriesList = [];
            let oldestTimeMS;
            let earliestTimeMS = options.range.from.unix() * 1000;

            const element = result.value;
            var indicator = {
              target: element.series,
              datapoints: [],
            };

            oldestTimeMS = element.timestamp * 1000;
            indicator.datapoints.push([element.value, element.timestamp * 1000]);

            let series = metrics[indicator.target];
            if (!series) {
              series = { target: indicator.target, datapoints: [] };
              metrics[indicator.target] = series;
            }
            series.datapoints = [...series.datapoints, ...indicator.datapoints];

            // Slide the "window" and remove older points
            series.datapoints = series.datapoints.filter(
              p => p[1] > oldestTimeMS - (options.range.to.unix() * 1000 - options.range.from.unix() * 1000)
            );
            if (series.datapoints[0] && series.datapoints[0][1] && series.datapoints[0][1] > earliestTimeMS) {
              earliestTimeMS = series.datapoints[0][1];
            }
            seriesList.push(series);

            const ts = Object.keys(metrics).map(key => {
              return metrics[key];
            });

            subject.next({
              data: ts,
              range: { from: moment(earliestTimeMS), to: moment(oldestTimeMS) },
            });
            reader.read().then(read);
          })
        );
      });

    return this.q.resolve({
      subscribe: function(options) {
        return subject.subscribe(options);
      },
    });
  }

  // testDatasource() {
  //   return this.doRequest({
  //     url: this.url + '/',
  //     method: 'GET',
  //   }).then(response => {
  //     if (response.status === 200) {
  //       return { status: 'success', message: 'Data source is working', title: 'Success' };
  //     }
  //   });
  // }
}
