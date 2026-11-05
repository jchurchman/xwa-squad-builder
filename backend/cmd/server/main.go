// Command server runs the XWA Squad Builder API.
//
// TODO: serve the built client from this server too (architecture doc, D10). Until then,
// `npm start` runs the API only.
package main

import (
	"context"
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

	// Without card data every request would quietly return nothing, so refuse to start.
	hasCards, err := st.HasCards(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	if !hasCards {
		log.Fatalf("no card data in %s: run `npm run backend:import` first", *dbPath)
	}

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
