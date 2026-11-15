package carddata

import (
	"reflect"
	"strings"
	"testing"
	"testing/fstest"
)

const testManifest = `{
	"version": "3.9.1",
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
		"cost": 6, "loadout": 10, "standard": true, "extended": true, "epic": true,
		"slots": ["Force Power", "Astromech"], "keywords": ["X-wing"],
		"force": {"value": 2, "side": ["light"]}
	}]
}`

const testUpgrades = `[
	{
		"xws": "000", "name": "0-0-0", "limited": 1, "cost": {"value": 3}, "extended": true, "epic": true,
		"sides": [{"type": "Crew", "slots": ["Crew"]}],
		"restrictions": [{"factions": ["scumandvillainy"], "names": ["Darth Vader"]}, {"action": {"type": "Calculate"}}]
	},
	{
		"xws": "admiralozzel", "name": "Admiral Ozzel", "limited": 1, "standardLoadoutOnly": true,
		"sides": [{"type": "Command", "slots": ["Command", "Crew"]}]
	},
	{
		"xws": "combatboardingtube", "name": "Combat Boarding Tube", "cost": {"value": "?"}, "epic": true,
		"sides": [{"type": "Command", "slots": ["Command"]}]
	},
	{"xws": "delta7b", "name": "Delta-7B", "sides": [{"type": "Configuration", "slots": ["Configuration"]}]}
]`

func testFS() fstest.MapFS {
	return fstest.MapFS{
		manifestPath:                   {Data: []byte(testManifest)},
		"data/pilots/rebel/tie.json":   {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "size": "Small", "pilots": [{"xws": "sabinewren-tielnfighter", "name": "Sabine Wren", "initiative": 3, "cost": 4, "loadout": 8, "epic": true}]}`)},
		"data/pilots/rebel/xwing.json": {Data: []byte(testXWing)},
		"data/pilots/empire/tie.json":  {Data: []byte(`{"xws": "tielnfighter", "name": "TIE/ln Fighter", "size": "Small", "pilots": [{"xws": "blacksquadronace", "name": "Black Squadron Ace", "initiative": 3, "cost": 3, "standardLoadout": ["admiralozzel"], "shipAbility": {"name": "Autothrusters"}}]}`)},
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
		{XWS: "combatboardingtube", Name: "Combat Boarding Tube", Slots: []string{"Command"}},
		{XWS: "delta7b", Name: "Delta-7B", Slots: []string{"Configuration"}},
	}
	if !reflect.DeepEqual(cards.Upgrades, want) {
		t.Errorf("upgrades = %+v, want %+v", cards.Upgrades, want)
	}
}

func TestLoadAMGPoints(t *testing.T) {
	cards, err := Load(testFS())
	if err != nil {
		t.Fatal(err)
	}

	want := AMGPoints{
		DataVersion: "3.9.1",
		Pilots: []PilotCost{
			{PilotXWS: "sabinewren-tielnfighter", Cost: 4, Loadout: 8, Formats: []string{FormatEpic}},
			{
				PilotXWS: "lukeskywalker", Cost: 6, Loadout: 10, Slots: []string{"Force Power", "Astromech"},
				Formats: []string{FormatStandard, FormatExtended, FormatEpic},
			},
			{PilotXWS: "blacksquadronace", Cost: 3},
		},
		// Admiral Ozzel is standard-loadout-only, so it has no cost and no row. Combat Boarding Tube
		// is priced "?" and Delta-7B has no cost and no legal format, so both are unpriced rows.
		Upgrades: []UpgradeCost{
			{UpgradeXWS: "000", Cost: intPtr(3), Formats: []string{FormatExtended, FormatEpic}},
			{UpgradeXWS: "combatboardingtube"},
			{UpgradeXWS: "delta7b"},
		},
	}
	if !reflect.DeepEqual(cards.AMGPoints, want) {
		t.Errorf("AMGPoints = %+v, want %+v", cards.AMGPoints, want)
	}
}

func TestLoadRejectsMissingCosts(t *testing.T) {
	tests := map[string]struct {
		path, data, wantErr string
	}{
		"pilot": {
			path:    "data/pilots/empire/tie.json",
			data:    `{"xws": "tielnfighter", "name": "TIE/ln Fighter", "pilots": [{"xws": "blacksquadronace", "name": "Black Squadron Ace", "initiative": 3}]}`,
			wantErr: `pilot "blacksquadronace" in data/pilots/empire/tie.json has no cost`,
		},
		"upgrade cost that is neither a number nor ?": {
			path:    "data/upgrades/crew.json",
			data:    `[{"xws": "000", "name": "0-0-0", "cost": {"value": "free"}, "sides": [{"type": "Crew"}]}]`,
			wantErr: `upgrade "000" in data/upgrades/crew.json: cost "free" is neither a number nor "?"`,
		},
		"upgrade that is not standard-loadout-only": {
			path:    "data/upgrades/crew.json",
			data:    `[{"xws": "000", "name": "0-0-0", "epic": true, "sides": [{"type": "Crew"}]}]`,
			wantErr: `upgrade "000" in data/upgrades/crew.json has no cost`,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			fsys := testFS()
			fsys[tt.path] = &fstest.MapFile{Data: []byte(tt.data)}

			_, err := Load(fsys)
			if err == nil || err.Error() != tt.wantErr {
				t.Fatalf("err = %v, want %q", err, tt.wantErr)
			}
		})
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

func intPtr(v int) *int { return &v }
