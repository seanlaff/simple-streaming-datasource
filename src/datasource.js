import { StreamHandler } from './stream_handler';

export class StreamingDatasource {
  constructor(instanceSettings, $q) {
    this.url = instanceSettings.url;
    this.q = $q;
    this.headers = { 'Content-Type': 'application/json' };

    // Keep a list of open streams so we can cancel them when querys/timerange change
    this.openStreams = [];
  }

  query(options) {
    var stream = this.openStreams[options.panelId];
    if (stream) {
      return Promise.resolve(stream);
    }

    stream = new StreamHandler(options, this);
    this.openStreams[options.panelId] = stream;
    stream.open();

    return Promise.resolve(stream);
  }

  closeStream(panelId) {
    var stream = this.openStreams[panelId];
    if (stream) {
      stream.close();
      delete this.openStreams[panelId];
    }
  }
}
