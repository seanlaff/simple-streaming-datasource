import { QueryCtrl } from 'app/plugins/sdk';

export class StreamingQueryCtrl extends QueryCtrl {
  constructor($scope, $injector) {
    super($scope, $injector);

    this.scope = $scope;
    this.target.numSeries = this.target.numSeries || 1;
  }

  onChangeInternal() {
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
}

StreamingQueryCtrl.templateUrl = 'partials/query.editor.html';
