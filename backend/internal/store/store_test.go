package store

import (
	"context"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
)

var testCards = &carddata.Cards{
	Ships: []carddata.Ship{
		{XWS: "tielnfighter", Name: "TIE/ln Fighter"},
		{XWS: "t65xwing", Name: "T-65 X-wing"},
	},
	Pilots: []carddata.Pilot{
		{XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5, ShipXWS: "t65xwing", FactionXWS: "rebelalliance"},
		{XWS: "bluesquadronescort", Name: "Blue Squadron Escort", Initiative: 2, ShipXWS: "t65xwing", FactionXWS: "rebelalliance"},
		{XWS: "sabinewren-tielnfighter", Name: "Sabine Wren", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "rebelalliance"},
		{XWS: "blacksquadronace", Name: "Black Squadron Ace", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "galacticempire"},
	},
}

func openTestStore(t *testing.T) *Store {
	t.Helper()
	st, err := Open(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { st.Close() })
	return st
}

func TestListShipsFiltersByFactionAndSorts(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)
	if err := st.ReplaceCards(ctx, testCards); err != nil {
		t.Fatal(err)
	}

	got, err := st.ListShips(ctx, "rebelalliance")
	if err != nil {
		t.Fatal(err)
	}

	want := []FactionShip{
		{XWS: "t65xwing", Name: "T-65 X-wing", Pilots: []carddata.Pilot{
			{XWS: "bluesquadronescort", Name: "Blue Squadron Escort", Initiative: 2, ShipXWS: "t65xwing", FactionXWS: "rebelalliance"},
			{XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5, ShipXWS: "t65xwing", FactionXWS: "rebelalliance"},
		}},
		{XWS: "tielnfighter", Name: "TIE/ln Fighter", Pilots: []carddata.Pilot{
			{XWS: "sabinewren-tielnfighter", Name: "Sabine Wren", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "rebelalliance"},
		}},
	}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("ListShips = %+v, want %+v", got, want)
	}
}

func TestReplaceCardsCanRunTwice(t *testing.T) {
	ctx := context.Background()
	st := openTestStore(t)
	for i := 0; i < 2; i++ {
		if err := st.ReplaceCards(ctx, testCards); err != nil {
			t.Fatalf("import %d: %v", i+1, err)
		}
	}

	got, err := st.ListShips(ctx, "galacticempire")
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || len(got[0].Pilots) != 1 {
		t.Errorf("after re-import got %+v, want one ship with one pilot", got)
	}
}
