package store

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
)

const testAMGLabel = "xwing-data2 3.9.1 @0dc446f"

var testImportTime = time.Date(2026, 11, 15, 12, 0, 0, 0, time.UTC)

// testAMGPoints prices every card in testCards. Admiral Ozzel is standard-loadout-only, so it has
// no cost.
func testAMGPoints() carddata.AMGPoints {
	allFormats := []string{carddata.FormatStandard, carddata.FormatExtended, carddata.FormatEpic}
	return carddata.AMGPoints{
		DataVersion: "3.9.1",
		Pilots: []carddata.PilotCost{
			{PilotXWS: "lukeskywalker", Cost: 6, Loadout: 10, Slots: []string{"Force Power", "Astromech"}, Formats: allFormats},
			{PilotXWS: "bluesquadronescort", Cost: 4, Loadout: 4, Slots: []string{"Astromech"}, Formats: allFormats},
			{PilotXWS: "sabinewren-tielnfighter", Cost: 4, Formats: allFormats},
			{PilotXWS: "blacksquadronace", Cost: 3, Loadout: 2, Formats: []string{carddata.FormatEpic}},
		},
		Upgrades: []carddata.UpgradeCost{{UpgradeXWS: "000", Cost: intPtr(3), Formats: allFormats}},
	}
}

func openStoreWithCards(t *testing.T) *Store {
	t.Helper()
	st := openTestStore(t)
	if err := st.ReplaceCards(context.Background(), testCards); err != nil {
		t.Fatal(err)
	}
	return st
}

func countRows(t *testing.T, st *Store, table string) int {
	t.Helper()
	var n int
	if err := st.db.QueryRow("SELECT COUNT(*) FROM " + table).Scan(&n); err != nil {
		t.Fatal(err)
	}
	return n
}

func TestImportAMGPointsCreatesPublishedVersion(t *testing.T) {
	st := openStoreWithCards(t)

	created, err := st.ImportAMGPoints(context.Background(), testAMGLabel, testAMGPoints(), testImportTime)
	if err != nil || !created {
		t.Fatalf("ImportAMGPoints = %v, %v; want true, nil", created, err)
	}

	var source, status, createdAt string
	var maxListPoints int
	var effectiveDate *string
	if err := st.db.QueryRow(
		"SELECT source, status, max_list_points, effective_date, created_at FROM points_versions WHERE label = ?",
		testAMGLabel,
	).Scan(&source, &status, &maxListPoints, &effectiveDate, &createdAt); err != nil {
		t.Fatal(err)
	}
	if source != "amg" || status != "published" || maxListPoints != 20 || effectiveDate != nil ||
		createdAt != "2026-11-15T12:00:00Z" {
		t.Errorf("version = %s %s %d %v %s, want amg published 20 <nil> 2026-11-15T12:00:00Z",
			source, status, maxListPoints, effectiveDate, createdAt)
	}

	var slots, formats string
	if err := st.db.QueryRow(
		"SELECT slots, formats FROM pilot_costs WHERE pilot_xws = 'blacksquadronace'",
	).Scan(&slots, &formats); err != nil {
		t.Fatal(err)
	}
	if slots != "null" || formats != `["epic"]` {
		t.Errorf("blacksquadronace slots, formats = %s, %s; want null, [\"epic\"]", slots, formats)
	}
	if got := countRows(t, st, "pilot_costs"); got != 4 {
		t.Errorf("pilot_costs rows = %d, want 4", got)
	}
	if got := countRows(t, st, "upgrade_costs"); got != 1 {
		t.Errorf("upgrade_costs rows = %d, want 1", got)
	}
}

func TestImportAMGPointsStoresUnpricedUpgradeWithoutCost(t *testing.T) {
	st := openStoreWithCards(t)
	points := testAMGPoints()
	points.Upgrades = []carddata.UpgradeCost{{UpgradeXWS: "000"}}

	if _, err := st.ImportAMGPoints(context.Background(), testAMGLabel, points, testImportTime); err != nil {
		t.Fatal(err)
	}
	var cost *int
	var formats string
	if err := st.db.QueryRow("SELECT cost, formats FROM upgrade_costs WHERE upgrade_xws = '000'").Scan(&cost, &formats); err != nil {
		t.Fatal(err)
	}
	if cost != nil || formats != "null" {
		t.Errorf("cost, formats = %v, %s; want <nil>, null", cost, formats)
	}
}

func TestImportAMGPointsSkipsExistingLabel(t *testing.T) {
	ctx := context.Background()
	st := openStoreWithCards(t)
	if _, err := st.ImportAMGPoints(ctx, testAMGLabel, testAMGPoints(), testImportTime); err != nil {
		t.Fatal(err)
	}

	created, err := st.ImportAMGPoints(ctx, testAMGLabel, testAMGPoints(), testImportTime.Add(time.Hour))
	if err != nil || created {
		t.Fatalf("second ImportAMGPoints = %v, %v; want false, nil", created, err)
	}
	if got := countRows(t, st, "points_versions"); got != 1 {
		t.Errorf("points_versions rows = %d, want 1", got)
	}
}

func TestPointsSurviveCardReimport(t *testing.T) {
	ctx := context.Background()
	st := openStoreWithCards(t)
	if _, err := st.ImportAMGPoints(ctx, testAMGLabel, testAMGPoints(), testImportTime); err != nil {
		t.Fatal(err)
	}

	if err := st.ReplaceCards(ctx, testCards); err != nil {
		t.Fatal(err)
	}
	if got := countRows(t, st, "pilot_costs"); got != 4 {
		t.Errorf("pilot_costs rows after card re-import = %d, want 4", got)
	}
}

func TestImportAMGPointsRejectsCostsThatDoNotMatchCards(t *testing.T) {
	tests := map[string]struct {
		change  func(*carddata.AMGPoints)
		wantErr string
	}{
		"unknown pilot": {
			change: func(p *carddata.AMGPoints) {
				p.Pilots = append(p.Pilots, carddata.PilotCost{PilotXWS: "nosuchpilot", Cost: 1})
			},
			wantErr: `cost for unknown pilot "nosuchpilot"`,
		},
		"pilot without a cost": {
			change:  func(p *carddata.AMGPoints) { p.Pilots = p.Pilots[1:] },
			wantErr: `no cost for pilot "lukeskywalker"`,
		},
		"unknown upgrade": {
			change: func(p *carddata.AMGPoints) {
				p.Upgrades = append(p.Upgrades, carddata.UpgradeCost{UpgradeXWS: "nosuchupgrade", Cost: intPtr(1)})
			},
			wantErr: `cost for unknown upgrade "nosuchupgrade"`,
		},
		"upgrade without a cost": {
			change:  func(p *carddata.AMGPoints) { p.Upgrades = nil },
			wantErr: `no cost for upgrade "000"`,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			st := openStoreWithCards(t)
			points := testAMGPoints()
			tt.change(&points)

			_, err := st.ImportAMGPoints(context.Background(), testAMGLabel, points, testImportTime)
			if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
				t.Fatalf("err = %v, want it to contain %q", err, tt.wantErr)
			}
			if got := countRows(t, st, "points_versions"); got != 0 {
				t.Errorf("points_versions rows = %d, want 0 after a failed import", got)
			}
		})
	}
}

func TestImportXWAPointsCreatesPublishedXWAVersion(t *testing.T) {
	ctx := context.Background()
	st := openStoreWithCards(t)
	amg := testAMGPoints()
	if _, err := st.ImportAMGPoints(ctx, testAMGLabel, amg, testImportTime); err != nil {
		t.Fatal(err)
	}

	const label = "50P 2.1.1 (yasb @b252228)"
	created, err := st.ImportXWAPoints(ctx, label, amg.Pilots, amg.Upgrades, testImportTime)
	if err != nil || !created {
		t.Fatalf("ImportXWAPoints = %v, %v; want true, nil", created, err)
	}
	got, err := st.LatestPublishedPointsVersion(ctx, "xwa")
	if err != nil {
		t.Fatal(err)
	}
	if got.Label != label || got.MaxListPoints != 50 || len(got.Pilots) != 4 {
		t.Errorf("xwa version = %q %d with %d pilots, want %q 50 with 4", got.Label, got.MaxListPoints, len(got.Pilots), label)
	}
	if amgVersion, err := st.LatestPublishedPointsVersion(ctx, "amg"); err != nil || amgVersion.Label != testAMGLabel {
		t.Errorf("amg version = %v, %v; want it unchanged", amgVersion, err)
	}

	created, err = st.ImportXWAPoints(ctx, label, amg.Pilots, amg.Upgrades, testImportTime)
	if err != nil || created {
		t.Errorf("second ImportXWAPoints = %v, %v; want false, nil", created, err)
	}
}

func intPtr(v int) *int { return &v }

func TestLatestPublishedPointsVersion(t *testing.T) {
	ctx := context.Background()
	st := openStoreWithCards(t)

	if _, err := st.LatestPublishedPointsVersion(ctx, "amg"); !errors.Is(err, ErrNoPointsVersion) {
		t.Fatalf("before import: err = %v, want ErrNoPointsVersion", err)
	}

	older := testAMGPoints()
	newer := testAMGPoints()
	newer.Pilots[0].Cost = 7
	if _, err := st.ImportAMGPoints(ctx, "older", older, testImportTime); err != nil {
		t.Fatal(err)
	}
	if _, err := st.ImportAMGPoints(ctx, "newer", newer, testImportTime.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}

	got, err := st.LatestPublishedPointsVersion(ctx, "amg")
	if err != nil {
		t.Fatal(err)
	}
	if got.Label != "newer" || got.MaxListPoints != 20 || got.EffectiveDate != "" {
		t.Errorf("version = %q %d %q, want newer 20 \"\"", got.Label, got.MaxListPoints, got.EffectiveDate)
	}
	// Rows come back sorted by XWS ID.
	wantPilots := []string{"blacksquadronace", "bluesquadronescort", "lukeskywalker", "sabinewren-tielnfighter"}
	for i, p := range got.Pilots {
		if p.PilotXWS != wantPilots[i] {
			t.Fatalf("pilot %d = %q, want %q", i, p.PilotXWS, wantPilots[i])
		}
	}
	luke := got.Pilots[2]
	if luke.Cost != 7 || luke.Loadout != 10 || !reflect.DeepEqual(luke.Slots, []string{"Force Power", "Astromech"}) {
		t.Errorf("luke = %+v, want cost 7 from the newer version", luke)
	}
	if len(got.Upgrades) != 1 || *got.Upgrades[0].Cost != 3 || got.Upgrades[0].FactionXWS != "" {
		t.Errorf("upgrades = %+v, want one 000 cost of 3 for every faction", got.Upgrades)
	}

	if _, err := st.LatestPublishedPointsVersion(ctx, "xwa"); !errors.Is(err, ErrNoPointsVersion) {
		t.Errorf("xwa: err = %v, want ErrNoPointsVersion", err)
	}
}
