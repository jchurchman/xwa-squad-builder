// Package yasb reads XWA points from a checkout of YASB, the squad builder where XWA's points are
// maintained, and turns them into a points version's cost rows.
//
// Temporary: until XWA's points team edits points here (docs/architecture.md, D4), YASB is the
// source of XWA points.
package yasb

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"fmt"
	"os/exec"
	"slices"
	"strings"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
)

// extractScript prints YASB's card data as JSON; see extract.js.
//
//go:embed extract.js
var extractScript string

// Cards is YASB's card data, as extract.js prints it.
type Cards struct {
	// VersionInfo is the points version YASB shows, e.g. "50P-2.1.1".
	VersionInfo string    `json:"versionInfo"`
	Pilots      []Pilot   `json:"pilots"`
	Upgrades    []Upgrade `json:"upgrades"`
}

// Pilot is a YASB pilot's points.
type Pilot struct {
	XWS             string   `json:"xws"`
	Cost            int      `json:"cost"`
	Loadout         int      `json:"loadout"`
	Slots           []string `json:"slots"`
	StandardLoadout bool     `json:"standardLoadout"`
}

// Upgrade is a YASB upgrade's points.
type Upgrade struct {
	XWS string `json:"xws"`
	// Cost is nil for an upgrade YASB does not price.
	Cost     *int `json:"cost"`
	Standard bool `json:"standard"`
}

// Extract runs extract.js with Node against the YASB checkout at yasbPath.
func Extract(ctx context.Context, yasbPath string) (*Cards, error) {
	cmd := exec.CommandContext(ctx, "node", "-", yasbPath)
	cmd.Stdin = strings.NewReader(extractScript)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("reading YASB card data: %w: %s", err, stderr.String())
	}
	var cards Cards
	if err := json.Unmarshal(out, &cards); err != nil {
		return nil, fmt.Errorf("decoding YASB card data: %w", err)
	}
	if cards.VersionInfo == "" {
		return nil, fmt.Errorf("YASB card data has no points version (versioninfo)")
	}
	return &cards, nil
}

// Label names a points version after YASB's points version and commit, in XWA's style:
// "50P-2.1.1" at commit b2522283... becomes "50P 2.1.1 (yasb @b252228)".
func Label(versionInfo, commit string) string {
	const shortCommitLen = 7
	if len(commit) > shortCommitLen {
		commit = commit[:shortCommitLen]
	}
	return fmt.Sprintf("%s (yasb @%s)", strings.Replace(versionInfo, "-", " ", 1), commit)
}

// slotNames maps YASB's slot names to ours (the card data's). Every slot YASB uses must be here, so
// a new YASB slot stops the import instead of slipping through under a name nothing matches.
var slotNames = map[string]string{
	"Astromech":      "Astromech",
	"Cannon":         "Cannon",
	"Cargo":          "Cargo",
	"Command":        "Command",
	"Configuration":  "Configuration",
	"Crew":           "Crew",
	"Device":         "Device",
	"Force":          "Force Power",
	"Gunner":         "Gunner",
	"Hardpoint":      "Hardpoint",
	"HardpointShip":  "Weapon Hardpoint",
	"Hyperdrive":     "Hyperdrive",
	"Illicit":        "Illicit",
	"Missile":        "Missile",
	"Modification":   "Modification",
	"Sensor":         "Sensor",
	"Tactical Relay": "Tactical Relay",
	"Talent":         "Talent",
	"Team":           "Team",
	"Tech":           "Tech",
	"Title":          "Title",
	"Torpedo":        "Torpedo",
	"Turret":         "Turret",
	"VersatileShip":  "Versatile Frame",
}

// upgradeXWS maps our XWS IDs to YASB's for upgrades the two name differently.
var upgradeXWS = map[string]string{
	"asajjventresscommand":     "asajjventress-command",
	"generalgrievouscommand":   "generalgrievous-command",
	"hondoohnakacommand":       "hondoohnaka-command",
	"initforthemoneyrebellion": "initforthemoney",
}

// Report lists the cards an import could not price from YASB.
type Report struct {
	// SkippedPilots and SkippedUpgrades are priced YASB cards our card data does not have.
	SkippedPilots   []string
	SkippedUpgrades []string
	// UnpricedUpgrades are our upgrades YASB does not price. They are recorded without a cost, so
	// they are legal in no format.
	UnpricedUpgrades []string
	// NoFormats are cards YASB prices whose AMG rows give no format (e.g. upgrades AMG never
	// priced), so they are legal in no XWA format either.
	NoFormats []string
}

// Convert turns YASB's cards into XWA cost rows for every pilot and upgrade in the AMG points
// version imported with the current card data. AMG's rows decide which cards need a row, and their
// formats decide XWA legality (D4): Epic from AMG's Epic, Standard from AMG's Extended.
func Convert(cards *Cards, amgPilots []carddata.PilotCost, amgUpgrades []carddata.UpgradeCost) (
	[]carddata.PilotCost, []carddata.UpgradeCost, Report, error,
) {
	var report Report

	yasbPilots := make(map[string]Pilot, len(cards.Pilots))
	for _, p := range cards.Pilots {
		yasbPilots[p.XWS] = p
	}
	pilots := make([]carddata.PilotCost, 0, len(amgPilots))
	used := map[string]bool{}
	for _, a := range amgPilots {
		p, ok := yasbPilots[a.PilotXWS]
		if !ok {
			return nil, nil, Report{}, fmt.Errorf("YASB has no pilot %q", a.PilotXWS)
		}
		slots, err := ourSlots(p)
		if err != nil {
			return nil, nil, Report{}, err
		}
		used[p.XWS] = true
		formats := xwaFormats(a.Formats)
		if len(formats) == 0 {
			report.NoFormats = append(report.NoFormats, a.PilotXWS)
		}
		pilots = append(pilots, carddata.PilotCost{
			PilotXWS: a.PilotXWS, Cost: p.Cost, Loadout: p.Loadout, Slots: slots, Formats: formats,
		})
	}
	for _, p := range cards.Pilots {
		if !used[p.XWS] {
			report.SkippedPilots = append(report.SkippedPilots, p.XWS)
		}
	}

	priced, err := pricedUpgrades(cards.Upgrades)
	if err != nil {
		return nil, nil, Report{}, err
	}
	upgrades := make([]carddata.UpgradeCost, 0, len(amgUpgrades))
	used = map[string]bool{}
	for _, a := range amgUpgrades {
		yasbXWS := a.UpgradeXWS
		if alias, ok := upgradeXWS[yasbXWS]; ok {
			yasbXWS = alias
		}
		u, ok := priced[yasbXWS]
		if !ok {
			report.UnpricedUpgrades = append(report.UnpricedUpgrades, a.UpgradeXWS)
			upgrades = append(upgrades, carddata.UpgradeCost{UpgradeXWS: a.UpgradeXWS})
			continue
		}
		used[yasbXWS] = true
		formats := xwaFormats(a.Formats)
		if len(formats) == 0 {
			report.NoFormats = append(report.NoFormats, a.UpgradeXWS)
		}
		upgrades = append(upgrades, carddata.UpgradeCost{UpgradeXWS: a.UpgradeXWS, Cost: u.Cost, Formats: formats})
	}
	for _, u := range cards.Upgrades {
		if _, ok := priced[u.XWS]; ok && !used[u.XWS] {
			used[u.XWS] = true // report each XWS ID once
			report.SkippedUpgrades = append(report.SkippedUpgrades, u.XWS)
		}
	}
	return pilots, upgrades, report, nil
}

// pricedUpgrades indexes the upgrades YASB prices by XWS ID. YASB reuses an XWS ID for a priced
// upgrade's standard loadout copies (e.g. three "chewbacca-crew"), so those are left out; two priced
// upgrades with one ID would make the cost ambiguous, so that is an error.
func pricedUpgrades(upgrades []Upgrade) (map[string]Upgrade, error) {
	priced := map[string]Upgrade{}
	for _, u := range upgrades {
		if u.Standard || u.Cost == nil {
			continue
		}
		if _, ok := priced[u.XWS]; ok {
			return nil, fmt.Errorf("YASB prices two upgrades with XWS ID %q", u.XWS)
		}
		priced[u.XWS] = u
	}
	return priced, nil
}

func ourSlots(p Pilot) ([]string, error) {
	if p.StandardLoadout {
		return nil, nil
	}
	slots := make([]string, 0, len(p.Slots))
	for _, s := range p.Slots {
		ours, ok := slotNames[s]
		if !ok {
			return nil, fmt.Errorf("pilot %q has slot %q, which the YASB import does not know", p.XWS, s)
		}
		slots = append(slots, ours)
	}
	return slots, nil
}

// xwaFormats is a card's XWA legality from its AMG formats. XWA has no rotation, so a card legal in
// AMG's Extended is legal in XWA's Standard (working assumption, D4).
func xwaFormats(amg []string) []string {
	var formats []string
	if slices.Contains(amg, carddata.FormatExtended) {
		formats = append(formats, carddata.FormatStandard)
	}
	if slices.Contains(amg, carddata.FormatEpic) {
		formats = append(formats, carddata.FormatEpic)
	}
	return formats
}
