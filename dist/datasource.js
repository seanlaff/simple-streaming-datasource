'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamingDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _ndjson = require('./vendor/ndjson.js');

var ndjsonStream = _interopRequireWildcard(_ndjson);

var _rxjsUmdMin = require('./vendor/rxjs.umd.min.js');

var rxjs = _interopRequireWildcard(_rxjsUmdMin);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StreamingDatasource = exports.StreamingDatasource = function () {
  function StreamingDatasource(instanceSettings, $q, backendSrv, templateSrv) {
    _classCallCheck(this, StreamingDatasource);

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

  _createClass(StreamingDatasource, [{
    key: 'query',
    value: function query(options) {
      var subject = new rxjs.Subject();
      var metrics = {};

      var request = new Request('' + this.url);

      fetch(request).then(function (response) {
        // In our case our messages are new-line delimmited json, but partial messages
        // may come across the wire, so we use ndjson to help manage stitching them together
        return ndjsonStream.default(response.body);
      }).then(function (s) {
        var reader = s.getReader();
        var _read = void 0;
        reader.read().then(_read = function read(result) {
          if (result.done) {
            return;
          }
          var seriesList = [];
          var oldestTimeMS = void 0;
          var earliestTimeMS = options.range.from.unix() * 1000;

          var element = result.value;
          var indicator = {
            target: element.series,
            datapoints: []
          };

          oldestTimeMS = element.timestamp * 1000;
          indicator.datapoints.push([element.value, element.timestamp * 1000]);

          var series = metrics[indicator.target];
          if (!series) {
            series = { target: indicator.target, datapoints: [] };
            metrics[indicator.target] = series;
          }
          series.datapoints = [].concat(_toConsumableArray(series.datapoints), _toConsumableArray(indicator.datapoints));

          // Slide the "window" and remove older points
          series.datapoints = series.datapoints.filter(function (p) {
            return p[1] > oldestTimeMS - (options.range.to.unix() * 1000 - options.range.from.unix() * 1000);
          });
          if (series.datapoints[0] && series.datapoints[0][1] && series.datapoints[0][1] > earliestTimeMS) {
            earliestTimeMS = series.datapoints[0][1];
          }
          seriesList.push(series);

          var ts = Object.keys(metrics).map(function (key) {
            return metrics[key];
          });

          subject.next({
            data: ts,
            range: { from: (0, _moment2.default)(earliestTimeMS), to: (0, _moment2.default)(oldestTimeMS) }
          });
          reader.read().then(_read);
        });
      });

      return this.q.resolve({
        subscribe: function subscribe(options) {
          return subject.subscribe(options);
        }
      });
    }
  }, {
    key: 'testDatasource',
    value: function testDatasource() {
      return this.doRequest({
        url: this.url + '/',
        method: 'GET'
      }).then(function (response) {
        if (response.status === 200) {
          return { status: 'success', message: 'Data source is working', title: 'Success' };
        }
      });
    }
  }]);

  return StreamingDatasource;
}();
//# sourceMappingURL=datasource.js.map
