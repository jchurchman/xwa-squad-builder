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

//go:embed schema.sql
var schema string

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

// Open opens (creating if needed) the database at path and applies the schema.
func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", "file:"+path+"?_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	if _, err := db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("applying schema: %w", err)
	}
	return &Store{db: db}, nil
}

// Close closes the database.
func (s *Store) Close() error {
	return s.db.Close()
}

// ReplaceCards swaps all card rows for cards in one transaction.
func (s *Store) ReplaceCards(ctx context.Context, cards *carddata.Cards) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	for _, stmt := range []string{"DELETE FROM pilots", "DELETE FROM ships"} {
		if _, err := tx.ExecContext(ctx, stmt); err != nil {
			return err
		}
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

// ListShips returns the ships a faction flies, sorted by name, each with that faction's pilots
// sorted by initiative and then name.
func (s *Store) ListShips(ctx context.Context, factionXWS string) ([]FactionShip, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT s.xws, s.name, p.xws, p.name, p.initiative
		FROM pilots p
		JOIN ships s ON s.xws = p.ship_xws
		WHERE p.faction_xws = ?
		ORDER BY s.name, p.initiative, p.name`, factionXWS)
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
