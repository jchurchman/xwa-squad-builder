// Command importcards loads card definitions from the pinned xwing-data2 fork into the database,
// and records the fork's AMG points as a published points version.
//
// By default it downloads the commit named in cards.version. Set CARD_DATA_PATH to a local
// checkout of the fork to import from it instead; local imports skip the AMG points, since a
// published version must come from a known commit.
package main

import (
	"context"
	"flag"
	"fmt"
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
	shortCommitLen  = 7
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
	var pin *carddata.Pin
	root := os.Getenv(cardDataPathEnv)
	if root == "" {
		pinText, err := os.ReadFile(pinPath)
		if err != nil {
			return err
		}
		parsed, err := carddata.ParsePin(string(pinText))
		if err != nil {
			return err
		}
		pin = &parsed

		tmp, err := os.MkdirTemp("", "xwing-data2-")
		if err != nil {
			return err
		}
		defer os.RemoveAll(tmp)

		log.Printf("downloading %s@%s", pin.Repo, pin.Commit)
		client := &http.Client{Timeout: downloadTimeout}
		if root, err = carddata.Download(ctx, client, parsed, tmp); err != nil {
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

	if pin == nil {
		log.Printf("skipping AMG points: local card data has no pinned commit")
		return nil
	}
	return importAMGPoints(ctx, st, cards.AMGPoints, *pin)
}

func importAMGPoints(ctx context.Context, st *store.Store, points carddata.AMGPoints, pin carddata.Pin) error {
	label := amgPointsLabel(points.DataVersion, pin.Commit)
	created, err := st.ImportAMGPoints(ctx, label, points, time.Now())
	if err != nil {
		return err
	}
	if !created {
		log.Printf("AMG points version %q already exists", label)
		return nil
	}
	log.Printf("recorded AMG points version %q: %d pilot and %d upgrade costs",
		label, len(points.Pilots), len(points.Upgrades))
	return nil
}

// amgPointsLabel names an AMG points version after the card data it came from.
func amgPointsLabel(dataVersion, commit string) string {
	if len(commit) > shortCommitLen {
		commit = commit[:shortCommitLen]
	}
	return fmt.Sprintf("xwing-data2 %s @%s", dataVersion, commit)
}
