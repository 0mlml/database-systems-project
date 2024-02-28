package handlers

import (
	"encoding/json"
	"event_management_system/models"
	"fmt"
	"net/http"
)

// Mock database for demonstration
var events = []models.Event{}

func AddEvent(w http.ResponseWriter, r *http.Request) {
	var newEvent models.Event
	err := json.NewDecoder(r.Body).Decode(&newEvent)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("Received new event: %+v\n", newEvent)

	events = append(events, newEvent) // In real applications, you'd save this to a database
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(newEvent)
}
