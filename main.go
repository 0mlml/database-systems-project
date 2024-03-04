package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/0mlml/cfgparser"
	_ "github.com/lib/pq"
)

var config *cfgparser.Config

var db *sql.DB

func initDb() (err error) {
	psqlInfo := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		config.String("db_host"), config.Int("db_port"), config.String("db_user"), config.String("db_pass"), config.String("db_name"))

	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		return
	}
	err = db.Ping()
	if err != nil {
		return
	}
	log.Println("Successfully connected to database!")
	return
}

func executeQuery(query string) (result string, err error) {
	if strings.HasPrefix(strings.ToUpper(strings.TrimSpace(query)), "SELECT") {
		rows, err := db.Query(query)
		if err != nil {
			return "", err
		}
		defer rows.Close()

		columns, err := rows.Columns()
		if err != nil {
			return "", err
		}

		var rowsData []string
		for rows.Next() {
			columnsData := make([]interface{}, len(columns))
			columnPointers := make([]interface{}, len(columns))
			for i := range columnsData {
				columnPointers[i] = &columnsData[i]
			}

			if err := rows.Scan(columnPointers...); err != nil {
				return "", err
			}

			var rowData []string
			for _, col := range columnsData {
				rowData = append(rowData, fmt.Sprintf("%v", col))
			}
			rowsData = append(rowsData, strings.Join(rowData, ", "))
		}

		if err = rows.Err(); err != nil {
			return "", err
		}

		result = strings.Join(rowsData, "\n")
		return result, nil
	} else {
		res, err := db.Exec(query)
		if err != nil {
			return "", err
		}

		id, err := res.LastInsertId()
		if err == nil && id != 0 {
			return fmt.Sprintf("Last Insert ID: %d", id), nil
		}

		affected, err := res.RowsAffected()
		if err != nil {
			return "", err
		}

		return fmt.Sprintf("Rows affected: %d", affected), nil
	}
}

func tableExists(tableName string) (doesExist bool, err error) {
	query := `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1;`

	var count int
	err = db.QueryRow(query, tableName).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func getTableKeys(tableName string) (string, error) {
	query := `
SELECT column_name
FROM information_schema.columns
WHERE table_name = $1
ORDER BY ordinal_position;
`

	rows, err := db.Query(query, tableName)
	if err != nil {
		return "", fmt.Errorf("query execution error: %w", err)
	}
	defer rows.Close()

	var keys []string
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return "", fmt.Errorf("failed to scan row: %w", err)
		}
		keys = append(keys, key)
	}

	if err = rows.Err(); err != nil {
		return "", fmt.Errorf("error iterating rows: %w", err)
	}

	return strings.Join(keys, ","), nil
}

func initConfig() {
	defaultConfig := &cfgparser.Config{}
	defaultConfig.Literal(
		map[string]bool{},
		map[string]string{
			"db_host": "localhost",
			"db_user": "postgres",
			"db_pass": "password",
			"db_name": "event_management_system",
		},
		map[string]int{
			"db_port": 5432,
			"port":    8080,
		},
		map[string]float64{},
	)

	cfgparser.SetDefaultConfig(defaultConfig)

	config = &cfgparser.Config{}
	configPath := "hospital-mgr.cfg"
	if err := config.From(configPath); err != nil {
		config.Default()
		config.To(configPath)
	}
}

func handleFetchTableHeaders(w http.ResponseWriter, r *http.Request) {
	type tableHeaderRequest struct {
		TableName string `json:"tableName"`
	}

	thr := tableHeaderRequest{}
	err := json.NewDecoder(r.Body).Decode(&thr)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		log.Printf("Error parsing request: %v", err)
		return
	}

	log.Printf("Received table header request: %s", thr.TableName)

	exists, err := tableExists(thr.TableName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		log.Printf("Error checking table existence: %v", err)
		return
	}

	if !exists {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("Table not found"))
		log.Printf("Table not found: %s", thr.TableName)
		return
	}

	keys, err := getTableKeys(thr.TableName)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		log.Printf("Error getting table keys: %v", err)
		return
	}

	w.Write([]byte(keys))
}

func submitQueryHandler(w http.ResponseWriter, r *http.Request) {
	type queryRequest struct {
		Query string `json:"query"`
	}
	qr := queryRequest{}
	err := json.NewDecoder(r.Body).Decode(&qr)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		log.Printf("Error parsing request: %v", err)
		return
	}

	log.Printf("Received query: %s\n", qr.Query)

	result, err := executeQuery(qr.Query)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		log.Printf("Error executing query: %v", err)
		return
	}

	log.Printf("Query found %d lines\n", len(strings.Split(result, "\n")))

	w.Write([]byte(result))
}

func main() {
	log.SetFlags(log.LstdFlags)

	initConfig()

	err := initDb()
	if err != nil {
		log.Println(err)
		return
	}

	log.Printf("Starting server on port %d, see http://localhost:%d\n", config.Int("port"), config.Int("port"))
	http.HandleFunc("/submitQuery", submitQueryHandler)
	http.HandleFunc("/fetchTableHeaders", handleFetchTableHeaders)
	http.Handle("/", http.FileServer(http.Dir("static")))

	http.ListenAndServe(fmt.Sprintf(":%d", config.Int("port")), nil)
}
