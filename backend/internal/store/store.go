// Package store is the SQLite database behind the backend.
package store

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"

	_ "modernc.org/sqlite"
)

// cardSchema drops and recreates the card tables. It runs at the start of every import.
//
//go:embed schema.sql
var cardSchema string

// Store wraps the database connection.
type Store struct {
	db *sql.DB
}

// FactionShip is a ship together with the pilots one faction flies it with.
type FactionShip struct {
	carddata.Ship
	Pilots []carddata.Pilot
}

// Open opens (creating if needed) the database at path. Card tables exist only after an import.
func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	return &Store{db: db}, nil
}

// Close closes the database.
func (s *Store) Close() error {
	return s.db.Close()
}

// ReplaceCards recreates the card tables and fills them from cards, in one transaction.
func (s *Store) ReplaceCards(ctx context.Context, cards *carddata.Cards) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, cardSchema); err != nil {
		return fmt.Errorf("creating card tables: %w", err)
	}

	for _, ship := range cards.Ships {
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO ships (xws, name, size, actions, arcs) VALUES (?, ?, ?, ?, ?)",
			ship.XWS, ship.Name, ship.Size, toJSON(ship.Actions), toJSON(ship.Arcs),
		); err != nil {
			return fmt.Errorf("inserting ship %q: %w", ship.XWS, err)
		}
	}

	for _, p := range cards.Pilots {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO pilots (xws, name, initiative, limited, ship_xws, faction_xws, slots,
				standard_loadout, keywords, ship_ability, ship_actions, force_sides)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			p.XWS, p.Name, p.Initiative, p.Limited, p.ShipXWS, p.FactionXWS, toJSON(p.Slots),
			toJSON(p.StandardLoadout), toJSON(p.Keywords), p.ShipAbility, toJSON(p.ShipActions),
			toJSON(p.ForceSides),
		); err != nil {
			return fmt.Errorf("inserting pilot %q: %w", p.XWS, err)
		}
	}

	for _, u := range cards.Upgrades {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO upgrades (xws, name, limited, standard_loadout_only, slots, restrictions)
			VALUES (?, ?, ?, ?, ?, ?)`,
			u.XWS, u.Name, u.Limited, u.StandardLoadoutOnly, toJSON(u.Slots), toJSON(u.Restrictions),
		); err != nil {
			return fmt.Errorf("inserting upgrade %q: %w", u.XWS, err)
		}
	}

	return tx.Commit()
}

// HasCards reports whether the card import has run and loaded at least one pilot.
func (s *Store) HasCards(ctx context.Context) (bool, error) {
	var tableExists bool
	if err := s.db.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'pilots')",
	).Scan(&tableExists); err != nil || !tableExists {
		return false, err
	}

	var hasPilots bool
	err := s.db.QueryRowContext(ctx, "SELECT EXISTS (SELECT 1 FROM pilots)").Scan(&hasPilots)
	return hasPilots, err
}

// ListShips returns the ships a faction flies, sorted by name, each with that faction's pilots
// sorted by initiative and then name.
func (s *Store) ListShips(ctx context.Context, factionXWS string) ([]FactionShip, error) {
	// Sorting by xws after name keeps each ship's rows together even if two ships share a name;
	// the grouping below relies on that.
	rows, err := s.db.QueryContext(ctx, `
		SELECT s.xws, s.name, s.size, s.actions, s.arcs,
			p.xws, p.name, p.initiative, p.limited, p.slots, p.standard_loadout, p.keywords,
			p.ship_ability, p.ship_actions, p.force_sides
		FROM pilots p
		JOIN ships s ON s.xws = p.ship_xws
		WHERE p.faction_xws = ?
		ORDER BY s.name, s.xws, p.initiative, p.name`, factionXWS)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ships []FactionShip
	for rows.Next() {
		var ship carddata.Ship
		var shipActions, shipArcs string
		pilot := carddata.Pilot{FactionXWS: factionXWS}
		var slots, standardLoadout, keywords, pilotActions, forceSides string

		if err := rows.Scan(
			&ship.XWS, &ship.Name, &ship.Size, &shipActions, &shipArcs,
			&pilot.XWS, &pilot.Name, &pilot.Initiative, &pilot.Limited, &slots, &standardLoadout,
			&keywords, &pilot.ShipAbility, &pilotActions, &forceSides,
		); err != nil {
			return nil, err
		}
		pilot.ShipXWS = ship.XWS

		if err := decodeJSONColumns(
			jsonColumn{shipActions, &ship.Actions},
			jsonColumn{shipArcs, &ship.Arcs},
			jsonColumn{slots, &pilot.Slots},
			jsonColumn{standardLoadout, &pilot.StandardLoadout},
			jsonColumn{keywords, &pilot.Keywords},
			jsonColumn{pilotActions, &pilot.ShipActions},
			jsonColumn{forceSides, &pilot.ForceSides},
		); err != nil {
			return nil, fmt.Errorf("pilot %q: %w", pilot.XWS, err)
		}

		if len(ships) == 0 || ships[len(ships)-1].XWS != ship.XWS {
			ships = append(ships, FactionShip{Ship: ship})
		}
		last := &ships[len(ships)-1]
		last.Pilots = append(last.Pilots, pilot)
	}
	return ships, rows.Err()
}

// ListUpgrades returns every upgrade, sorted by name.
func (s *Store) ListUpgrades(ctx context.Context) ([]carddata.Upgrade, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT xws, name, limited, standard_loadout_only, slots, restrictions
		FROM upgrades
		ORDER BY name, xws`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var upgrades []carddata.Upgrade
	for rows.Next() {
		var u carddata.Upgrade
		var slots, restrictions string
		if err := rows.Scan(&u.XWS, &u.Name, &u.Limited, &u.StandardLoadoutOnly, &slots, &restrictions); err != nil {
			return nil, err
		}
		if err := decodeJSONColumns(
			jsonColumn{slots, &u.Slots},
			jsonColumn{restrictions, &u.Restrictions},
		); err != nil {
			return nil, fmt.Errorf("upgrade %q: %w", u.XWS, err)
		}
		upgrades = append(upgrades, u)
	}
	return upgrades, rows.Err()
}

// jsonColumn pairs a JSON column's raw text with the value to decode it into.
type jsonColumn struct {
	raw  string
	dest any
}

func decodeJSONColumns(columns ...jsonColumn) error {
	for _, c := range columns {
		if err := json.Unmarshal([]byte(c.raw), c.dest); err != nil {
			return err
		}
	}
	return nil
}

func toJSON(v any) string {
	data, err := json.Marshal(v)
	if err != nil {
		// Only plain slices and structs are stored, which always marshal.
		panic(fmt.Sprintf("marshaling %T: %v", v, err))
	}
	return string(data)
}
