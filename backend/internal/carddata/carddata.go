// Package carddata reads card definitions from a copy of the xwing-data2 fork.
package carddata

import (
	"encoding/json"
	"fmt"
	"io/fs"
)

const manifestPath = "data/manifest.json"

// Ship is a ship chassis. The same ship can be flown by several factions.
type Ship struct {
	XWS  string
	Name string
}

// Pilot is a pilot card. Each pilot belongs to exactly one ship and one faction.
type Pilot struct {
	XWS        string
	Name       string
	Initiative int
	ShipXWS    string
	FactionXWS string
}

// Cards is everything loaded from the card data.
type Cards struct {
	Ships  []Ship
	Pilots []Pilot
}

type manifest struct {
	Pilots []struct {
		Faction string   `json:"faction"`
		Ships   []string `json:"ships"`
	} `json:"pilots"`
}

type shipFile struct {
	XWS    string `json:"xws"`
	Name   string `json:"name"`
	Pilots []struct {
		XWS        string `json:"xws"`
		Name       string `json:"name"`
		Initiative int    `json:"initiative"`
	} `json:"pilots"`
}

// Load reads the manifest and every ship file it lists. fsys must be rooted at the top of the
// xwing-data2 repository (the directory containing data/).
func Load(fsys fs.FS) (*Cards, error) {
	var m manifest
	if err := readJSON(fsys, manifestPath, &m); err != nil {
		return nil, err
	}

	cards := &Cards{}
	seenShips := map[string]bool{}
	seenPilots := map[string]string{}

	for _, faction := range m.Pilots {
		for _, path := range faction.Ships {
			var sf shipFile
			if err := readJSON(fsys, path, &sf); err != nil {
				return nil, err
			}

			if !seenShips[sf.XWS] {
				seenShips[sf.XWS] = true
				cards.Ships = append(cards.Ships, Ship{XWS: sf.XWS, Name: sf.Name})
			}

			for _, p := range sf.Pilots {
				if previous, ok := seenPilots[p.XWS]; ok {
					return nil, fmt.Errorf("duplicate pilot xws %q in %s (first seen in %s)", p.XWS, path, previous)
				}
				seenPilots[p.XWS] = path
				cards.Pilots = append(cards.Pilots, Pilot{
					XWS:        p.XWS,
					Name:       p.Name,
					Initiative: p.Initiative,
					ShipXWS:    sf.XWS,
					FactionXWS: faction.Faction,
				})
			}
		}
	}

	return cards, nil
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
