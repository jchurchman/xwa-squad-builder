package carddata

import (
	"reflect"
	"strings"
	"testing"
	"testing/fstest"
)

const testManifest = `{
	"pilots": [
		{"faction": "rebelalliance", "ships": ["data/pilots/rebel/tie.json", "data/pilots/rebel/xwing.json"]},
		{"faction": "galacticempire", "ships": ["data/pilots/empire/tie.json"]}
	],
	"upgrades": ["data/upgrades/crew.json"]
}`

const testXWing = `{
	"xws": "t65xwing", "name": "T-65 X-wing", "size": "Small",
	"actions": [{"type": "Focus", "difficulty": "White"}, {"type": "Barrel Roll", "difficulty": "White", "linked": {"type": "Focus", "difficulty": "Red"}}],
	"stats": [{"type": "attack", "arc": "Front Arc", "value": 3}, {"type": "agility", "value": 2}],
	"pilots": [{
		"xws": "lukeskywalker", "name": "Luke Skywalker", "initiative": 5, "limited": 1,
		"slots": ["Force Power", "Astromech"], "keywords": ["X-wing"],
		"force": {"value": 2, "side": ["light"]}
	}]
}`

const testUpgrades = `[
	{
		"xws": "000", "name": "0-0-0", "limited": 1,
		"sides": [{"type": "Crew", "slots": ["Crew"]}],
		"restrictions": [{"factions": ["scumandvillainy"], "names": ["Darth Vader"]}, {"action": {"type": "Calculate"}}]
	},
	{
		"xws": "admiralozzel", "name": "Admiral Ozzel", "limited": 1, "standardLoadoutOnly": true,
		"sides": [{"type": "Command", "slots": ["Command", "Crew"]}]
	}
]`

func testFS() fstest.MapFS {
	return fstest.MapFS{
		manifestPath:                   {Data: []byte(testManifest)},
		"data/pilots/rebel/tie.json":   {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "size": "Small", "pilots": [{"xws": "sabinewren-tielnfighter", "name": "Sabine Wren", "initiative": 3}]}`)},
		"data/pilots/rebel/xwing.json": {Data: []byte(testXWing)},
		"data/pilots/empire/tie.json":  {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "size": "Small", "pilots": [{"xws": "blacksquadronace", "name": "Black Squadron Ace", "initiative": 3, "standardLoadout": ["admiralozzel"], "shipAbility": {"name": "Autothrusters"}}]}`)},
		"data/upgrades/crew.json":      {Data: []byte(testUpgrades)},
	}
}

func TestLoadShipsAndPilots(t *testing.T) {
	cards, err := Load(testFS())
	if err != nil {
		t.Fatal(err)
	}

	wantShips := []Ship{
		{XWS: "tielnfighter", Name: "TIE/ln Fighter", Size: "Small"},
		{
			XWS: "t65xwing", Name: "T-65 X-wing", Size: "Small",
			Actions: []Action{{Type: "Focus", Difficulty: "White"}, {Type: "Barrel Roll", Difficulty: "White"}},
			Arcs:    []string{"Front Arc"},
		},
	}
	if !reflect.DeepEqual(cards.Ships, wantShips) {
		t.Errorf("ships = %+v, want %+v", cards.Ships, wantShips)
	}

	wantPilots := []Pilot{
		{XWS: "sabinewren-tielnfighter", Name: "Sabine Wren", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "rebelalliance"},
		{
			XWS: "lukeskywalker", Name: "Luke Skywalker", Initiative: 5, Limited: 1, ShipXWS: "t65xwing", FactionXWS: "rebelalliance",
			Slots: []string{"Force Power", "Astromech"}, Keywords: []string{"X-wing"}, ForceSides: []string{"light"},
		},
		{
			XWS: "blacksquadronace", Name: "Black Squadron Ace", Initiative: 3, ShipXWS: "tielnfighter", FactionXWS: "galacticempire",
			StandardLoadout: []string{"admiralozzel"}, ShipAbility: "Autothrusters",
		},
	}
	if !reflect.DeepEqual(cards.Pilots, wantPilots) {
		t.Errorf("pilots = %+v, want %+v", cards.Pilots, wantPilots)
	}
}

func TestLoadUpgrades(t *testing.T) {
	cards, err := Load(testFS())
	if err != nil {
		t.Fatal(err)
	}

	want := []Upgrade{
		{
			XWS: "000", Name: "0-0-0", Slots: []string{"Crew"}, Limited: 1,
			Restrictions: []RestrictionGroup{
				{Factions: []string{"scumandvillainy"}, Names: []string{"Darth Vader"}},
				{Actions: []Action{{Type: "Calculate"}}},
			},
		},
		{XWS: "admiralozzel", Name: "Admiral Ozzel", Slots: []string{"Command", "Crew"}, Limited: 1, StandardLoadoutOnly: true},
	}
	if !reflect.DeepEqual(cards.Upgrades, want) {
		t.Errorf("upgrades = %+v, want %+v", cards.Upgrades, want)
	}
}

func TestLoadRejectsUnknownRestrictions(t *testing.T) {
	fsys := testFS()
	fsys["data/upgrades/crew.json"] = &fstest.MapFile{Data: []byte(
		`[{"xws": "x", "name": "X", "sides": [{"type": "Crew"}], "restrictions": [{"pointsBelow": 5}]}]`,
	)}

	_, err := Load(fsys)
	if err == nil || !strings.Contains(err.Error(), "pointsBelow") {
		t.Fatalf("err = %v, want an error naming the unknown restriction", err)
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
