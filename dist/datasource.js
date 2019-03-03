'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamingDatasource = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _stream_handler = require('./stream_handler');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StreamingDatasource = exports.StreamingDatasource = function () {
  function StreamingDatasource(instanceSettings, $q) {
    _classCallCheck(this, StreamingDatasource);

    this.url = instanceSettings.url;
    this.q = $q;
    this.headers = { 'Content-Type': 'application/json' };

    // Keep a list of open streams so we can cancel them when querys/timerange change
    this.openStreams = [];
  }

  _createClass(StreamingDatasource, [{
    key: 'query',
    value: function query(options) {
      var stream = this.openStreams[options.panelId];
      if (stream) {
        return Promise.resolve(stream);
      }

      stream = new _stream_handler.StreamHandler(options, this);
      this.openStreams[options.panelId] = stream;
      stream.open();

      return Promise.resolve(stream);
    }
  }, {
    key: 'closeStream',
    value: function closeStream(panelId) {
      var stream = this.openStreams[panelId];
      if (stream) {
        stream.close();
        delete this.openStreams[panelId];
      }
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

  }]);

  return StreamingDatasource;
}();
//# sourceMappingURL=datasource.js.map
