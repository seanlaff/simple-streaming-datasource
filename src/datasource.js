import _ from 'lodash';
import * as ndjsonStream from './vendor/ndjson.js';
import * as rxjs from './vendor/rxjs.umd.min.js';

export class GenericDatasource {
  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  query(options) {
    var subject = new rxjs.Subject();
    var metrics = {};

    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    if (query.targets.length <= 0) {
      return this.q.when({ data: [] });
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }

    var request = new Request(`${this.url}/query`);

    fetch(request)
      .then(response => {
        // In our case our messages are new-line delimmited json, but partial messages
        // may come across the wire, so we use ndjson to help manage stitching them together
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

            const element = result.value.result;
            var indicator = {
              target: element.id,
              datapoints: [],
            };
            for (var index = 0; index < element.times.length; index++) {
              let ts = [];
              oldestTimeMS = element.times[index] * 1000;
              ts = [element[dataField].data[index], element.times[index] * 1000];
              indicator.datapoints.push(ts);
            }

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

    return this.$q.resolve({
      subscribe: function(options) {
        return subject.subscribe(options);
      },
    });
  }

  testDatasource() {
    return this.doRequest({
      url: this.url + '/',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }
    });
  }

  annotationQuery(options) {
    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    var annotationQuery = {
      range: options.range,
      annotation: {
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
        query: query,
      },
      rangeRaw: options.rangeRaw,
    };

    return this.doRequest({
      url: this.url + '/annotations',
      method: 'POST',
      data: annotationQuery,
    }).then(result => {
      return result.data;
    });
  }

  metricFindQuery(query) {
    var interpolated = {
      target: this.templateSrv.replace(query, null, 'regex'),
    };

    return this.doRequest({
      url: this.url + '/search',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      } else if (_.isObject(d)) {
        return { text: d, value: i };
      }
      return { text: d, value: d };
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  buildQueryParameters(options) {
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie',
      };
    });

    options.targets = targets;

    return options;
  }

  getTagKeys(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-keys',
        method: 'POST',
        data: options,
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-values',
        method: 'POST',
        data: options,
      }).then(result => {
        return resolve(result.data);
      });
    });
  }
}
