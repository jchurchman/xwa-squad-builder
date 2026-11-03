// Command server runs the XWA Squad Builder API.
package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"connectrpc.com/connect/v2"
	"connectrpc.com/connect/v2/connecthttp"

	"github.com/jchurchman/xwa-squad-builder/backend/gen/xwa/cards/v1/cardsv1connect"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/cardservice"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

const (
	// apiPrefix matches the path the client's dev server proxies to this server.
	apiPrefix         = "/api"
	defaultPort       = "3001"
	readHeaderTimeout = 10 * time.Second
)

func main() {
	dbPath := flag.String("db", "xwa.db", "SQLite database file")
	flag.Parse()

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	st, err := store.Open(*dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	rpcServer := connect.NewServer()
	cardsv1connect.RegisterCardServiceHandler(rpcServer, cardservice.New(st))

	rpcMux := http.NewServeMux()
	connecthttp.Mount(rpcMux, rpcServer)

	mux := http.NewServeMux()
	mux.Handle(apiPrefix+"/", http.StripPrefix(apiPrefix, rpcMux))

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: readHeaderTimeout,
	}
	log.Printf("listening on %s", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
