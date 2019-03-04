'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StreamingQueryCtrl = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sdk = require('app/plugins/sdk');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var StreamingQueryCtrl = exports.StreamingQueryCtrl = function (_QueryCtrl) {
  _inherits(StreamingQueryCtrl, _QueryCtrl);

  function StreamingQueryCtrl($scope, $injector) {
    _classCallCheck(this, StreamingQueryCtrl);

    var _this = _possibleConstructorReturn(this, (StreamingQueryCtrl.__proto__ || Object.getPrototypeOf(StreamingQueryCtrl)).call(this, $scope, $injector));

    _this.scope = $scope;
    _this.target.numSeries = _this.target.numSeries || 1;
    return _this;
  }

  _createClass(StreamingQueryCtrl, [{
    key: 'onChangeInternal',
    value: function onChangeInternal() {
      this.datasource.closeStream(this.panel.id);

      // So here's the only real hack. We want to kill the old stream and open a new one
      // with the new query. Normally, this.panelCtrl.refresh() would take care of shooting
      // off a new call to datasource.query() however there's a conditional inside grafana's
      // onMetricsPanelRefresh() that prevents calling datasource.query() again if it sees that
      // this panel is connected to a datastream.
      //
      // To get around that, we'll null out the dataStream... which allows onMetricsPanelRefresh()
      // to call datasource.query()... which opens a new stream.
      //
      // Unfortunately this same behavior is why changing the time range will not affect an
      // existing streaming panel unless you save and refresh the dashboard.
      //
      // I'll open a PR to the team and see if I can get some more feedback on why that behavior exists.
      this.panelCtrl.dataStream = null;

      this.panelCtrl.refresh(); // Asks the panel to refresh data.
    }
  }]);

  return StreamingQueryCtrl;
}(_sdk.QueryCtrl);

StreamingQueryCtrl.templateUrl = 'partials/query.editor.html';
//# sourceMappingURL=query_ctrl.js.map
