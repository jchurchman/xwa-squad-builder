// Package carddata reads card definitions from a copy of the xwing-data2 fork.
package carddata

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/fs"
)

const (
	manifestPath = "data/manifest.json"
	attackStat   = "attack"
)

// Action is a ship action, e.g. a white Focus.
type Action struct {
	Type       string `json:"type"`
	Difficulty string `json:"difficulty,omitempty"`
}

// Ship is a ship chassis. The same ship can be flown by several factions.
type Ship struct {
	XWS     string
	Name    string
	Size    string
	Actions []Action
	// Arcs the ship has a primary attack in.
	Arcs []string
}

// Pilot is a pilot card. Each pilot belongs to exactly one ship and one faction.
type Pilot struct {
	XWS        string
	Name       string
	Initiative int
	Limited    int
	ShipXWS    string
	FactionXWS string
	// Slots are read from the card data until points versions exist (see docs/architecture.md).
	Slots           []string
	StandardLoadout []string
	Keywords        []string
	ShipAbility     string
	// ShipActions replaces the ship's actions for this pilot when not empty.
	ShipActions []Action
	ForceSides  []string
}

// Upgrade is an upgrade card. Two-sided upgrades are described by their first side.
type Upgrade struct {
	XWS                 string
	Name                string
	Slots               []string
	Limited             int
	StandardLoadoutOnly bool
	Restrictions        []RestrictionGroup
}

// RestrictionGroup is met when at least one of its conditions is met. An upgrade's groups must
// all be met.
type RestrictionGroup struct {
	Factions      []string `json:"factions,omitempty"`
	Ships         []string `json:"ships,omitempty"`
	Sizes         []string `json:"sizes,omitempty"`
	Actions       []Action `json:"actions,omitempty"`
	Keywords      []string `json:"keywords,omitempty"`
	ShipAbilities []string `json:"shipAbilities,omitempty"`
	Names         []string `json:"names,omitempty"`
	Equipped      []string `json:"equipped,omitempty"`
	Arcs          []string `json:"arcs,omitempty"`
	ForceSides    []string `json:"forceSides,omitempty"`
	Solitary      bool     `json:"solitary,omitempty"`
	Standardized  bool     `json:"standardized,omitempty"`
	NonLimited    *bool    `json:"nonLimited,omitempty"`
}

// Cards is everything loaded from the card data.
type Cards struct {
	Ships    []Ship
	Pilots   []Pilot
	Upgrades []Upgrade
}

type manifest struct {
	Pilots []struct {
		Faction string   `json:"faction"`
		Ships   []string `json:"ships"`
	} `json:"pilots"`
	Upgrades []string `json:"upgrades"`
}

type shipFile struct {
	XWS     string   `json:"xws"`
	Name    string   `json:"name"`
	Size    string   `json:"size"`
	Actions []Action `json:"actions"`
	Stats   []struct {
		Type string `json:"type"`
		Arc  string `json:"arc"`
	} `json:"stats"`
	Pilots []pilotEntry `json:"pilots"`
}

// pilotEntry is one pilot in a ship file.
type pilotEntry struct {
	XWS             string   `json:"xws"`
	Name            string   `json:"name"`
	Initiative      int      `json:"initiative"`
	Limited         int      `json:"limited"`
	Slots           []string `json:"slots"`
	StandardLoadout []string `json:"standardLoadout"`
	Keywords        []string `json:"keywords"`
	ShipAbility     *struct {
		Name string `json:"name"`
	} `json:"shipAbility"`
	ShipActions []Action `json:"shipActions"`
	Force       *struct {
		Side []string `json:"side"`
	} `json:"force"`
}

// upgradeEntry is one upgrade in an upgrade file.
type upgradeEntry struct {
	XWS                 string `json:"xws"`
	Name                string `json:"name"`
	Limited             int    `json:"limited"`
	StandardLoadoutOnly bool   `json:"standardLoadoutOnly"`
	Sides               []struct {
		Type  string   `json:"type"`
		Slots []string `json:"slots"`
	} `json:"sides"`
	Restrictions []json.RawMessage `json:"restrictions"`
}

// rawRestriction mirrors xwing-data2's restriction format. Unknown keys are rejected so that a
// new kind of restriction in the data fails the import instead of being silently ignored.
type rawRestriction struct {
	Factions    []string `json:"factions"`
	Ships       []string `json:"ships"`
	Sizes       []string `json:"sizes"`
	Action      *Action  `json:"action"`
	Keywords    []string `json:"keywords"`
	ShipAbility []string `json:"shipAbility"`
	Names       []string `json:"names"`
	Equipped    []string `json:"equipped"`
	Arcs        []string `json:"arcs"`
	ForceSide   []string `json:"force_side"`
	Solitary    bool     `json:"solitary"`
	Standard    bool     `json:"standardized"`
	NonLimited  *bool    `json:"non-limited"`
}

// Load reads the manifest and every ship and upgrade file it lists. fsys must be rooted at the
// top of the xwing-data2 repository (the directory containing data/).
func Load(fsys fs.FS) (*Cards, error) {
	var m manifest
	if err := readJSON(fsys, manifestPath, &m); err != nil {
		return nil, err
	}

	ships, pilots, err := loadShipsAndPilots(fsys, m)
	if err != nil {
		return nil, err
	}
	upgrades, err := loadUpgrades(fsys, m)
	if err != nil {
		return nil, err
	}
	return &Cards{Ships: ships, Pilots: pilots, Upgrades: upgrades}, nil
}

func loadShipsAndPilots(fsys fs.FS, m manifest) ([]Ship, []Pilot, error) {
	var ships []Ship
	var pilots []Pilot
	seenShips := map[string]bool{}
	seenPilots := map[string]string{}

	for _, faction := range m.Pilots {
		for _, path := range faction.Ships {
			var sf shipFile
			if err := readJSON(fsys, path, &sf); err != nil {
				return nil, nil, err
			}

			if !seenShips[sf.XWS] {
				seenShips[sf.XWS] = true
				ships = append(ships, shipFileToShip(sf))
			}

			for _, p := range sf.Pilots {
				if previous, ok := seenPilots[p.XWS]; ok {
					return nil, nil, fmt.Errorf("duplicate pilot xws %q in %s (first seen in %s)", p.XWS, path, previous)
				}
				seenPilots[p.XWS] = path

				pilots = append(pilots, pilotEntryToPilot(p, sf.XWS, faction.Faction))
			}
		}
	}
	return ships, pilots, nil
}

func shipFileToShip(sf shipFile) Ship {
	ship := Ship{XWS: sf.XWS, Name: sf.Name, Size: sf.Size, Actions: sf.Actions}
	for _, stat := range sf.Stats {
		if stat.Type == attackStat {
			ship.Arcs = append(ship.Arcs, stat.Arc)
		}
	}
	return ship
}

func pilotEntryToPilot(p pilotEntry, shipXWS, factionXWS string) Pilot {
	pilot := Pilot{
		XWS:             p.XWS,
		Name:            p.Name,
		Initiative:      p.Initiative,
		Limited:         p.Limited,
		ShipXWS:         shipXWS,
		FactionXWS:      factionXWS,
		Slots:           p.Slots,
		StandardLoadout: p.StandardLoadout,
		Keywords:        p.Keywords,
		ShipActions:     p.ShipActions,
	}
	if p.ShipAbility != nil {
		pilot.ShipAbility = p.ShipAbility.Name
	}
	if p.Force != nil {
		pilot.ForceSides = p.Force.Side
	}
	return pilot
}

func loadUpgrades(fsys fs.FS, m manifest) ([]Upgrade, error) {
	var upgrades []Upgrade
	seen := map[string]string{}

	for _, path := range m.Upgrades {
		var entries []upgradeEntry
		if err := readJSON(fsys, path, &entries); err != nil {
			return nil, err
		}

		for _, u := range entries {
			if previous, ok := seen[u.XWS]; ok {
				return nil, fmt.Errorf("duplicate upgrade xws %q in %s (first seen in %s)", u.XWS, path, previous)
			}
			seen[u.XWS] = path

			upgrade, err := upgradeEntryToUpgrade(u)
			if err != nil {
				return nil, fmt.Errorf("upgrade %q in %s: %w", u.XWS, path, err)
			}
			upgrades = append(upgrades, upgrade)
		}
	}
	return upgrades, nil
}

func upgradeEntryToUpgrade(u upgradeEntry) (Upgrade, error) {
	if len(u.Sides) == 0 {
		return Upgrade{}, fmt.Errorf("no sides")
	}
	slots := u.Sides[0].Slots
	if len(slots) == 0 {
		slots = []string{u.Sides[0].Type}
	}

	upgrade := Upgrade{
		XWS:                 u.XWS,
		Name:                u.Name,
		Slots:               slots,
		Limited:             u.Limited,
		StandardLoadoutOnly: u.StandardLoadoutOnly,
	}
	for _, raw := range u.Restrictions {
		group, err := parseRestriction(raw)
		if err != nil {
			return Upgrade{}, err
		}
		upgrade.Restrictions = append(upgrade.Restrictions, group)
	}
	return upgrade, nil
}

func parseRestriction(raw json.RawMessage) (RestrictionGroup, error) {
	dec := json.NewDecoder(bytes.NewReader(raw))
	dec.DisallowUnknownFields()

	var r rawRestriction
	if err := dec.Decode(&r); err != nil {
		return RestrictionGroup{}, fmt.Errorf("parsing restriction %s: %w", raw, err)
	}

	group := RestrictionGroup{
		Factions:      r.Factions,
		Ships:         r.Ships,
		Sizes:         r.Sizes,
		Keywords:      r.Keywords,
		ShipAbilities: r.ShipAbility,
		Names:         r.Names,
		Equipped:      r.Equipped,
		Arcs:          r.Arcs,
		ForceSides:    r.ForceSide,
		Solitary:      r.Solitary,
		Standardized:  r.Standard,
		NonLimited:    r.NonLimited,
	}
	if r.Action != nil {
		group.Actions = []Action{*r.Action}
	}
	return group, nil
}

func readJSON(fsys fs.FS, path string, v any) error {
	data, err := fs.ReadFile(fsys, path)
	if err != nil {
		return fmt.Errorf("reading %s: %w", path, err)
	}
	if err := json.Unmarshal(data, v); err != nil {
		return fmt.Errorf("parsing %s: %w", path, err)
	}
	return nil
}
