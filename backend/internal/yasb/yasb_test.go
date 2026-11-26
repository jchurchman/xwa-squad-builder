package yasb

import (
	"reflect"
	"strings"
	"testing"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
)

var (
	extendedAndEpic = []string{carddata.FormatStandard, carddata.FormatExtended, carddata.FormatEpic}
	standardAndEpic = []string{carddata.FormatStandard, carddata.FormatEpic}
)

func intPtr(v int) *int { return &v }

// testInputs is a small YASB export and the AMG rows it is converted against.
func testInputs() (*Cards, []carddata.PilotCost, []carddata.UpgradeCost) {
	cards := &Cards{
		VersionInfo: "50P-2.1.1",
		Pilots: []Pilot{
			{XWS: "lukeskywalker", Cost: 14, Loadout: 10, Slots: []string{"Force", "Torpedo"}},
			{XWS: "serissu", Cost: 10, Loadout: 11, Slots: []string{"Talent", "HardpointShip"}},
			{XWS: "garvendreis-battleofyavin", Cost: 12, StandardLoadout: true},
			{XWS: "raymusantilles-epicsl", Cost: 3},
		},
		Upgrades: []Upgrade{
			{XWS: "chewbacca-crew", Cost: intPtr(2)},
			{XWS: "chewbacca-crew", Standard: true}, // a standard loadout copy reusing the ID
			{XWS: "asajjventress-command", Cost: intPtr(8)},
			{XWS: "r2d2-battleofyavin", Standard: true},
			{XWS: "sabinewren-command", Cost: intPtr(5)},
		},
	}
	amgPilots := []carddata.PilotCost{
		{PilotXWS: "lukeskywalker", Formats: extendedAndEpic},
		{PilotXWS: "serissu", Formats: []string{carddata.FormatStandard}}, // not in Extended
		{PilotXWS: "garvendreis-battleofyavin", Formats: extendedAndEpic},
	}
	amgUpgrades := []carddata.UpgradeCost{
		{UpgradeXWS: "chewbacca-crew", Formats: extendedAndEpic},
		{UpgradeXWS: "asajjventresscommand", Formats: []string{carddata.FormatEpic}},
		{UpgradeXWS: "hate", Formats: extendedAndEpic},
	}
	return cards, amgPilots, amgUpgrades
}

func TestConvertPilots(t *testing.T) {
	cards, amgPilots, amgUpgrades := testInputs()
	pilots, _, report, err := Convert(cards, amgPilots, amgUpgrades)
	if err != nil {
		t.Fatal(err)
	}
	want := []carddata.PilotCost{
		{PilotXWS: "lukeskywalker", Cost: 14, Loadout: 10, Slots: []string{"Force Power", "Torpedo"}, Formats: standardAndEpic},
		// Not in AMG's Extended, so not in XWA's Standard; no format left.
		{PilotXWS: "serissu", Cost: 10, Loadout: 11, Slots: []string{"Talent", "Weapon Hardpoint"}},
		// Standard loadout pilots have no slots.
		{PilotXWS: "garvendreis-battleofyavin", Cost: 12, Formats: standardAndEpic},
	}
	if !reflect.DeepEqual(pilots, want) {
		t.Errorf("pilots =\n%+v\nwant\n%+v", pilots, want)
	}
	if !reflect.DeepEqual(report.SkippedPilots, []string{"raymusantilles-epicsl"}) {
		t.Errorf("SkippedPilots = %v, want [raymusantilles-epicsl]", report.SkippedPilots)
	}
	if !reflect.DeepEqual(report.NoFormats, []string{"serissu"}) {
		t.Errorf("NoFormats = %v, want [serissu]", report.NoFormats)
	}
}

func TestConvertUpgrades(t *testing.T) {
	cards, amgPilots, amgUpgrades := testInputs()
	_, upgrades, report, err := Convert(cards, amgPilots, amgUpgrades)
	if err != nil {
		t.Fatal(err)
	}
	want := []carddata.UpgradeCost{
		// The standard loadout copy of chewbacca-crew does not hide the priced one.
		{UpgradeXWS: "chewbacca-crew", Cost: intPtr(2), Formats: standardAndEpic},
		// Matched through the XWS ID mapping.
		{UpgradeXWS: "asajjventresscommand", Cost: intPtr(8), Formats: []string{carddata.FormatEpic}},
		// YASB does not price it: recorded without a cost or formats.
		{UpgradeXWS: "hate"},
	}
	if !reflect.DeepEqual(upgrades, want) {
		t.Errorf("upgrades =\n%+v\nwant\n%+v", upgrades, want)
	}
	if !reflect.DeepEqual(report.UnpricedUpgrades, []string{"hate"}) {
		t.Errorf("UnpricedUpgrades = %v, want [hate]", report.UnpricedUpgrades)
	}
	if !reflect.DeepEqual(report.SkippedUpgrades, []string{"sabinewren-command"}) {
		t.Errorf("SkippedUpgrades = %v, want [sabinewren-command]", report.SkippedUpgrades)
	}
}

func TestConvertRejects(t *testing.T) {
	tests := map[string]struct {
		change  func(*Cards, *[]carddata.PilotCost)
		wantErr string
	}{
		"a pilot YASB does not have": {
			change: func(_ *Cards, amg *[]carddata.PilotCost) {
				*amg = append(*amg, carddata.PilotCost{PilotXWS: "nosuchpilot"})
			},
			wantErr: `YASB has no pilot "nosuchpilot"`,
		},
		"a slot the import does not know": {
			change:  func(c *Cards, _ *[]carddata.PilotCost) { c.Pilots[0].Slots = []string{"Mystery"} },
			wantErr: `pilot "lukeskywalker" has slot "Mystery"`,
		},
		"two priced upgrades with one ID": {
			change: func(c *Cards, _ *[]carddata.PilotCost) {
				c.Upgrades = append(c.Upgrades, Upgrade{XWS: "chewbacca-crew", Cost: intPtr(3)})
			},
			wantErr: `YASB prices two upgrades with XWS ID "chewbacca-crew"`,
		},
	}
	for name, tt := range tests {
		t.Run(name, func(t *testing.T) {
			cards, amgPilots, amgUpgrades := testInputs()
			tt.change(cards, &amgPilots)
			_, _, _, err := Convert(cards, amgPilots, amgUpgrades)
			if err == nil || !strings.Contains(err.Error(), tt.wantErr) {
				t.Fatalf("err = %v, want it to contain %q", err, tt.wantErr)
			}
		})
	}
}

func TestLabel(t *testing.T) {
	if got := Label("50P-2.1.1", "b2522283dd88b2a1"); got != "50P 2.1.1 (yasb @b252228)" {
		t.Errorf("Label = %q, want %q", got, "50P 2.1.1 (yasb @b252228)")
	}
}
