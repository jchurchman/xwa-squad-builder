// Command importcards loads card definitions from the pinned xwing-data2 fork into the database.
//
// By default it downloads the commit named in cards.version. Set CARD_DATA_PATH to a local
// checkout of the fork to import from it instead.
package main

import (
	"context"
	"flag"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
)

const (
	cardDataPathEnv = "CARD_DATA_PATH"
	downloadTimeout = 2 * time.Minute
)

func main() {
	dbPath := flag.String("db", "xwa.db", "SQLite database file")
	pinPath := flag.String("pin", "cards.version", "file naming the card data commit to import")
	flag.Parse()

	if err := run(context.Background(), *dbPath, *pinPath); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context, dbPath, pinPath string) error {
	root := os.Getenv(cardDataPathEnv)
	if root == "" {
		pinText, err := os.ReadFile(pinPath)
		if err != nil {
			return err
		}
		pin, err := carddata.ParsePin(string(pinText))
		if err != nil {
			return err
		}

		tmp, err := os.MkdirTemp("", "xwing-data2-")
		if err != nil {
			return err
		}
		defer os.RemoveAll(tmp)

		log.Printf("downloading %s@%s", pin.Repo, pin.Commit)
		client := &http.Client{Timeout: downloadTimeout}
		if root, err = carddata.Download(ctx, client, pin, tmp); err != nil {
			return err
		}
	} else {
		log.Printf("using local card data at %s", root)
	}

	cards, err := carddata.Load(os.DirFS(root))
	if err != nil {
		return err
	}

	st, err := store.Open(dbPath)
	if err != nil {
		return err
	}
	defer st.Close()

	if err := st.ReplaceCards(ctx, cards); err != nil {
		return err
	}
	log.Printf("imported %d ships, %d pilots, and %d upgrades into %s",
		len(cards.Ships), len(cards.Pilots), len(cards.Upgrades), dbPath)
	return nil
}
