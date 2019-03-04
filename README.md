## Simple Streaming Datasource - an end-to-end Grafana live streaming implementation

Inspired by the live-streaming [talk](https://www.youtube.com/watch?v=bPrDTvlNIj8&feature=youtu.be&t=4754) at Grafanacon 2019, this is a living example of streaming within a custom datasource- including a reference server that streams random data.

This example fixes some of the short commings mentioned mentioned in the talk

* Panel repaints are now throttled via RXJS throttling. You can tune the frequency to your use case.
* Stream lifecycles are handled by ndjson cancellation, and some tricks inside the datasource's `onChangeInternal()`

## Running the example

Install as you would any grafana datasource. Then, run `go run server.go`. This will spawn a server at `http://localhost:8080` that this example knows how to read data from.
