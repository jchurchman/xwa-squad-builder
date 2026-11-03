package carddata

import (
	"reflect"
	"strings"
	"testing"
	"testing/fstest"
)

const testManifest = `{"pilots": [
	{"faction": "rebelalliance", "ships": ["data/pilots/rebel/tie.json", "data/pilots/rebel/xwing.json"]},
	{"faction": "galacticempire", "ships": ["data/pilots/empire/tie.json"]}
]}`

func TestLoad(t *testing.T) {
	fsys := fstest.MapFS{
		manifestPath:                   {Data: []byte(testManifest)},
		"data/pilots/rebel/tie.json":   {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "pilots": [{"xws": "sabinewren-tielnfighter", "name": "Sabine Wren", "initiative": 3}]}`)},
		"data/pilots/rebel/xwing.json": {Data: []byte(`{"xws": "t65xwing", "name": "T-65 X-wing", "pilots": [{"xws": "lukeskywalker", "name": "Luke Skywalker", "initiative": 5}]}`)},
		"data/pilots/empire/tie.json":  {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "pilots": [{"xws": "blacksquadronace", "name": "Black Squadron Ace", "initiative": 3}]}`)},
	}

	cards, err := Load(fsys)
	if err != nil {
		t.Fatal(err)
	}

	wantShips := []Ship{
		{XWS: "tielnfighter", Name: "TIE/ln Fighter"},
		{XWS: "t65xwing", Name: "T-65 X-wing"},
	}
	if !reflect.DeepEqual(cards.Ships, wantShips) {
		t.Errorf("ships = %+v, want %+v", cards.Ships, wantShips)
	}

	wantPilots := []Pilot{
		{XWS: "sabinewren-tielnfighter", Name: "Sabine Wren", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "rebelalliance"},
		{XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5, ShipXWS: "t65xwing", FactionXWS: "rebelalliance"},
		{XWS: "blacksquadronace", Name: "Black Squadron Ace", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "galacticempire"},
	}
	if !reflect.DeepEqual(cards.Pilots, wantPilots) {
		t.Errorf("pilots = %+v, want %+v", cards.Pilots, wantPilots)
	}
}

func TestLoadRejectsDuplicatePilots(t *testing.T) {
	ship := `{"xws": "t65xwing", "name": "T-65 X-wing", "pilots": [{"xws": "lukeskywalker", "name": "Luke Skywalker", "initiative": 5}]}`
	fsys := fstest.MapFS{
		manifestPath: {Data: []byte(`{"pilots": [{"faction": "rebelalliance", "ships": ["a.json", "b.json"]}]}`)},
		"a.json":     {Data: []byte(ship)},
		"b.json":     {Data: []byte(ship)},
	}

	_, err := Load(fsys)
	if err == nil || !strings.Contains(err.Error(), "duplicate pilot") {
		t.Fatalf("err = %v, want duplicate pilot error", err)
	}
}

func TestParsePin(t *testing.T) {
	tests := []struct {
		in      string
		want    Pin
		wantErr bool
	}{
		{in: "jchurchman/xwing-data2@abc123\n", want: Pin{Repo: "jchurchman/xwing-data2", Commit: "abc123"}},
		{in: "xwing-data2@abc123", wantErr: true},
		{in: "jchurchman/xwing-data2", wantErr: true},
		{in: "jchurchman/xwing-data2@", wantErr: true},
	}
	for _, tt := range tests {
		got, err := ParsePin(tt.in)
		if (err != nil) != tt.wantErr {
			t.Errorf("ParsePin(%q) err = %v, wantErr %v", tt.in, err, tt.wantErr)
			continue
		}
		if got != tt.want {
			t.Errorf("ParsePin(%q) = %+v, want %+v", tt.in, got, tt.want)
		}
	}
}
