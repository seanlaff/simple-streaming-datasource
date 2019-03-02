package main

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"time"
)

type datapoint struct {
	Series    int   `json:"series"`
	Timestamp int64 `json:"timestamp"`
	Value     int   `json:"value"`
}

func main() {
	http.HandleFunc("/", handler)
	if err := http.ListenAndServe(":8080", nil); err != nil {
		panic(err)
	}

}

func handler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		panic("expected http.ResponseWriter to be an http.Flusher")
	}

	ticker := time.NewTicker(time.Second)
	for {
		select {
		case t := <-ticker.C:
			currentPoint := &datapoint{
				Series:    1,
				Timestamp: t.Unix(),
				Value:     rand.Intn(10),
			}
			j, _ := json.Marshal(currentPoint)
			fmt.Fprintf(w, "%s\n", j)
			flusher.Flush() // Trigger "chunked" encoding and send a chunk...
		}
	}

}
