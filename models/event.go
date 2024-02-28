package models

type Event struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Date        string `json:"date"` // Format: YYYY-MM-DD
	Location    string `json:"location"`
}
