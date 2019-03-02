'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConfigCtrl = exports.QueryCtrl = exports.Datasource = undefined;

var _datasource = require('./datasource');

var _query_ctrl = require('./query_ctrl');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StreamingConfigCtrl = function StreamingConfigCtrl() {
  _classCallCheck(this, StreamingConfigCtrl);
};

StreamingConfigCtrl.templateUrl = 'partials/config.html';

exports.Datasource = _datasource.StreamingDatasource;
exports.QueryCtrl = _query_ctrl.StreamingQueryCtrl;
exports.ConfigCtrl = StreamingConfigCtrl;
//# sourceMappingURL=module.js.map
