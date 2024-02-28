package main

import (
	"event_management_system/handlers"
	"net/http"
)

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))
	http.HandleFunc("/events", handlers.AddEvent)
	http.ListenAndServe(":8080", nil)
}
