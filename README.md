## Simple Streaming Datasource

### End-to-end Grafana live streaming implementation

Inspired by the live-streaming [talk](https://www.youtube.com/watch?v=bPrDTvlNIj8&feature=youtu.be&t=4754) at Grafanacon 2019, this is a living example of streaming within a datasource- including a reference server that streams random data.

![live streaming dashboard animation](/livedata.gif "live streaming dashboard")

This example fixes some of the short commings mentioned mentioned in the talk

* Panel repaints are now throttled via RXJS throttling. You can tune the frequency to your use case.
* Streams are cancelled/restarted when queries change

## Running the example

Install as you would any grafana datasource. Then, run `go run server.go`. This will spawn a server at `http://localhost:8080` that this datasource reads data from. Also included is a demo dashboard.

By default, the sever will stream data at 50ms, and the datasource plugin will throttle repaints to 100ms.

## Limitations

* Clicking the dashboard refresh, changing timerange, and some other report interactions do not cause the panel to "refresh". Here's a dicusssion about it https://github.com/grafana/grafana/issues/15760
* Backend server doesn't support providing a start/end time (it always starts streaming from time.Now()) for simplicity.
* Plugin makes no attempt to order the data. If its streamed in unordered, some backwards lines will be drawn.
* Adding more than one query in the datasource is currently unsupported, but could be easily added with some more state management. You'll likely want to multiplex all queries through the same stream (rather than open a stream per query) if your datasource can support it.
