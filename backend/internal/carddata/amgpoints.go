package carddata

import (
	"encoding/json"
	"fmt"
	"io/fs"
)

// unpricedCost is the cost value the card data gives an upgrade AMG never priced.
const unpricedCost = `"?"`

// Formats a card can be legal in.
const (
	FormatStandard = "standard"
	FormatExtended = "extended"
	FormatEpic     = "epic"
)

// AMGPoints is AMG's official points as recorded in the card data.
type AMGPoints struct {
	// DataVersion is the card data's own version, from its manifest.
	DataVersion string
	Pilots      []PilotCost
	Upgrades    []UpgradeCost
}

// PilotCost is a pilot's entry in a points version.
type PilotCost struct {
	PilotXWS string
	Cost     int
	Loadout  int
	Slots    []string
	Formats  []string
}

// UpgradeCost is an upgrade's entry in a points version. AMG prices an upgrade the same for every
// faction.
type UpgradeCost struct {
	UpgradeXWS string
	// Cost is nil for an upgrade AMG never priced. Such an upgrade is legal in no format.
	Cost    *int
	Formats []string
}

type formatFlags struct {
	Standard bool `json:"standard"`
	Extended bool `json:"extended"`
	Epic     bool `json:"epic"`
}

type amgPilotEntry struct {
	XWS     string   `json:"xws"`
	Cost    *int     `json:"cost"`
	Loadout int      `json:"loadout"`
	Slots   []string `json:"slots"`
	formatFlags
}

type amgUpgradeEntry struct {
	XWS  string `json:"xws"`
	Cost *struct {
		// Value is a number, or "?" for an upgrade AMG never priced.
		Value json.RawMessage `json:"value"`
	} `json:"cost"`
	StandardLoadoutOnly bool `json:"standardLoadoutOnly"`
	formatFlags
}

func loadAMGPoints(fsys fs.FS, m manifest) (AMGPoints, error) {
	pilots, err := loadAMGPilotCosts(fsys, m)
	if err != nil {
		return AMGPoints{}, err
	}
	upgrades, err := loadAMGUpgradeCosts(fsys, m)
	if err != nil {
		return AMGPoints{}, err
	}
	return AMGPoints{DataVersion: m.Version, Pilots: pilots, Upgrades: upgrades}, nil
}

func loadAMGPilotCosts(fsys fs.FS, m manifest) ([]PilotCost, error) {
	var costs []PilotCost
	for _, faction := range m.Pilots {
		for _, path := range faction.Ships {
			var sf struct {
				Pilots []amgPilotEntry `json:"pilots"`
			}
			if err := readJSON(fsys, path, &sf); err != nil {
				return nil, err
			}
			for _, p := range sf.Pilots {
				if p.Cost == nil {
					return nil, fmt.Errorf("pilot %q in %s has no cost", p.XWS, path)
				}
				costs = append(costs, amgPilotEntryToCost(p))
			}
		}
	}
	return costs, nil
}

func amgPilotEntryToCost(p amgPilotEntry) PilotCost {
	return PilotCost{
		PilotXWS: p.XWS,
		Cost:     *p.Cost,
		Loadout:  p.Loadout,
		Slots:    p.Slots,
		Formats:  formatFlagsToFormats(p.formatFlags),
	}
}

// loadAMGUpgradeCosts skips standard-loadout-only upgrades, which have no cost because they only
// come with a standard loadout pilot. An upgrade with no cost that is legal in no format is
// recorded as unpriced.
func loadAMGUpgradeCosts(fsys fs.FS, m manifest) ([]UpgradeCost, error) {
	var costs []UpgradeCost
	for _, path := range m.Upgrades {
		var entries []amgUpgradeEntry
		if err := readJSON(fsys, path, &entries); err != nil {
			return nil, err
		}
		for _, u := range entries {
			switch {
			case u.Cost == nil && u.StandardLoadoutOnly:
				continue
			case u.Cost == nil && len(formatFlagsToFormats(u.formatFlags)) == 0:
				costs = append(costs, UpgradeCost{UpgradeXWS: u.XWS})
				continue
			case u.Cost == nil:
				return nil, fmt.Errorf("upgrade %q in %s has no cost", u.XWS, path)
			}
			cost, err := amgUpgradeEntryToCost(u)
			if err != nil {
				return nil, fmt.Errorf("upgrade %q in %s: %w", u.XWS, path, err)
			}
			costs = append(costs, cost)
		}
	}
	return costs, nil
}

func amgUpgradeEntryToCost(u amgUpgradeEntry) (UpgradeCost, error) {
	if string(u.Cost.Value) == unpricedCost {
		return UpgradeCost{UpgradeXWS: u.XWS}, nil
	}
	var value int
	if err := json.Unmarshal(u.Cost.Value, &value); err != nil {
		return UpgradeCost{}, fmt.Errorf("cost %s is neither a number nor %s", u.Cost.Value, unpricedCost)
	}
	return UpgradeCost{UpgradeXWS: u.XWS, Cost: &value, Formats: formatFlagsToFormats(u.formatFlags)}, nil
}

func formatFlagsToFormats(f formatFlags) []string {
	var formats []string
	if f.Standard {
		formats = append(formats, FormatStandard)
	}
	if f.Extended {
		formats = append(formats, FormatExtended)
	}
	if f.Epic {
		formats = append(formats, FormatEpic)
	}
	return formats
}
