// Package store is the SQLite database behind the backend.
package store

import (
	"context"
	"database/sql"
	_ "embed"
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
	XWS    string
	Name   string
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
			"INSERT INTO ships (xws, name) VALUES (?, ?)", ship.XWS, ship.Name,
		); err != nil {
			return fmt.Errorf("inserting ship %q: %w", ship.XWS, err)
		}
	}

	for _, p := range cards.Pilots {
		if _, err := tx.ExecContext(ctx,
			"INSERT INTO pilots (xws, name, initiative, ship_xws, faction_xws) VALUES (?, ?, ?, ?, ?)",
			p.XWS, p.Name, p.Initiative, p.ShipXWS, p.FactionXWS,
		); err != nil {
			return fmt.Errorf("inserting pilot %q: %w", p.XWS, err)
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
		SELECT s.xws, s.name, p.xws, p.name, p.initiative
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
		var shipXWS, shipName string
		pilot := carddata.Pilot{FactionXWS: factionXWS}
		if err := rows.Scan(&shipXWS, &shipName, &pilot.XWS, &pilot.Name, &pilot.Initiative); err != nil {
			return nil, err
		}
		pilot.ShipXWS = shipXWS

		if len(ships) == 0 || ships[len(ships)-1].XWS != shipXWS {
			ships = append(ships, FactionShip{XWS: shipXWS, Name: shipName})
		}
		last := &ships[len(ships)-1]
		last.Pilots = append(last.Pilots, pilot)
	}
	return ships, rows.Err()
}
