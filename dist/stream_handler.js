'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamHandler = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _ndjson = require('./vendor/ndjson.js');

var ndjsonStream = _interopRequireWildcard(_ndjson);

var _rxjsUmdMin = require('./vendor/rxjs.umd.min.js');

var rxjs = _interopRequireWildcard(_rxjsUmdMin);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// We return a StreamHandler wrapped in a promise from the datasource's
// Query method. Grafana expects this object to have a `subscribe` method,
// which it knows how to read live data from.
var StreamHandler = exports.StreamHandler = function () {
  function StreamHandler(options, datasource) {
    var _this = this;

    _classCallCheck(this, StreamHandler);

    this.options = options;
    this.ds = datasource;
    this.subject = new rxjs.Subject();
    this.subscribe = function (options) {
      // To avoid destroying the browser with repaints, add a throttle
      var throttledSubject = _this.subject.pipe(rxjs.operators.throttleTime(1000));
      return throttledSubject.subscribe(options);
    };
    this.reader = null;
    this.metrics = {};
  }

  _createClass(StreamHandler, [{
    key: 'open',
    value: function open() {
      var _this2 = this;

      var request = new Request('' + this.ds.url);
      fetch(request).then(function (response) {
        // In the real world its likely that our json gets chopped into
        // chunks when streamed from the backend. ndjsonStream handles
        // reconstructing the newline-delimmited json for us.
        return ndjsonStream.default(response.body);
      }).then(function (s) {
        _this2.reader = s.getReader(); // Save the reader so we can cancel it later
        var _read = void 0; //handler

        _this2.reader.read().then(_read = function read(result) {
          if (result.done) {
            return;
          }

          _this2.handleMessage(result.value);

          _this2.reader.read().then(_read);
        });
      });
    }
  }, {
    key: 'handleMessage',
    value: function handleMessage(msg) {
      var _this3 = this;

      var seriesList = [];
      var oldestTimeMS = void 0;
      var earliestTimeMS = this.options.range.from.unix() * 1000;

      var indicator = {
        target: msg.series,
        datapoints: []
      };

      oldestTimeMS = msg.timestamp;
      indicator.datapoints.push([msg.value, msg.timestamp]);

      var series = this.metrics[indicator.target];
      if (!series) {
        series = { target: indicator.target, datapoints: [] };
        this.metrics[indicator.target] = series;
      }
      series.datapoints = [].concat(_toConsumableArray(series.datapoints), _toConsumableArray(indicator.datapoints));

      // Slide the "window" and remove older points
      series.datapoints = series.datapoints.filter(function (p) {
        return p[1] > oldestTimeMS - (_this3.options.range.to.unix() * 1000 - _this3.options.range.from.unix() * 1000);
      });
      if (series.datapoints[0] && series.datapoints[0][1] && series.datapoints[0][1] > earliestTimeMS) {
        earliestTimeMS = series.datapoints[0][1];
      }
      seriesList.push(series);

      var ts = Object.keys(this.metrics).map(function (key) {
        return _this3.metrics[key];
      });

      this.subject.next({
        data: ts,
        range: { from: (0, _moment2.default)(earliestTimeMS), to: (0, _moment2.default)(oldestTimeMS) }
      });
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.reader) {
        this.reader.cancel('Close was called on streamHandler');
      }
    }
  }]);

  return StreamHandler;
}();
//# sourceMappingURL=stream_handler.js.map
