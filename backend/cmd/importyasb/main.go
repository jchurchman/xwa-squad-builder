// Command importyasb records the XWA points in a YASB checkout as a published XWA points version.
//
// Temporary: until XWA's points team edits points here (docs/architecture.md, D4), YASB is the
// source of XWA points. Run `make import` first: XWA legality comes from the AMG points version
// that import records. The checkout must have no uncommitted changes to the files read, so the
// version's label names exactly what was imported.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"os/exec"
	"strings"
	"time"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/store"
	"github.com/jchurchman/xwa-squad-builder/backend/internal/yasb"
)

// yasbFiles are the files in the checkout the import reads.
var yasbFiles = []string{"coffeescripts/content/cards-common.coffee", "coffeescripts/system/xwing.coffee"}

func main() {
	dbPath := flag.String("db", "xwa.db", "SQLite database file")
	yasbPath := flag.String("yasb", "", "path to a YASB checkout (required)")
	flag.Parse()

	if *yasbPath == "" {
		log.Fatal("-yasb is required: the path to a YASB checkout")
	}
	if err := run(context.Background(), *dbPath, *yasbPath); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context, dbPath, yasbPath string) error {
	commit, err := cleanCommit(ctx, yasbPath)
	if err != nil {
		return err
	}
	cards, err := yasb.Extract(ctx, yasbPath)
	if err != nil {
		return err
	}

	st, err := store.Open(dbPath)
	if err != nil {
		return err
	}
	defer st.Close()

	amg, err := st.LatestPublishedPointsVersion(ctx, "amg")
	if errors.Is(err, store.ErrNoPointsVersion) {
		return errors.New("no AMG points version, which XWA legality comes from: run `make import` first")
	}
	if err != nil {
		return err
	}

	pilots, upgrades, report, err := yasb.Convert(cards, amg.Pilots, amg.Upgrades)
	if err != nil {
		return err
	}
	logReport(report)

	label := yasb.Label(cards.VersionInfo, commit)
	created, err := st.ImportXWAPoints(ctx, label, pilots, upgrades, time.Now())
	if err != nil {
		return err
	}
	if !created {
		log.Printf("XWA points version %q already exists", label)
		return nil
	}
	log.Printf("recorded XWA points version %q: %d pilot and %d upgrade costs, formats from AMG %q",
		label, len(pilots), len(upgrades), amg.Label)
	return nil
}

// cleanCommit returns the checkout's commit, or an error if the files the import reads have
// uncommitted changes.
func cleanCommit(ctx context.Context, yasbPath string) (string, error) {
	commit, err := git(ctx, yasbPath, "rev-parse", "HEAD")
	if err != nil {
		return "", err
	}
	changes, err := git(ctx, yasbPath, append([]string{"status", "--porcelain", "--"}, yasbFiles...)...)
	if err != nil {
		return "", err
	}
	if changes != "" {
		return "", fmt.Errorf("YASB checkout has uncommitted changes, so a label could not name them:\n%s", changes)
	}
	return commit, nil
}

func git(ctx context.Context, dir string, args ...string) (string, error) {
	out, err := exec.CommandContext(ctx, "git", append([]string{"-C", dir}, args...)...).Output()
	if err != nil {
		return "", fmt.Errorf("git %s in %s: %w", strings.Join(args, " "), dir, err)
	}
	return strings.TrimSpace(string(out)), nil
}

func logReport(r yasb.Report) {
	report := func(what string, xws []string) {
		if len(xws) > 0 {
			log.Printf("%s (%d): %s", what, len(xws), strings.Join(xws, ", "))
		}
	}
	report("skipped YASB pilots our card data does not have", r.SkippedPilots)
	report("skipped YASB upgrades our card data does not have", r.SkippedUpgrades)
	report("upgrades YASB does not price, recorded without a cost", r.UnpricedUpgrades)
	report("priced cards with no legal format from AMG", r.NoFormats)
}
