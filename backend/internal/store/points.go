package store

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	"time"

	"github.com/jchurchman/xwa-squad-builder/backend/internal/carddata"
)

// pointsSchema creates the points tables if they are missing. It never drops anything.
//
//go:embed points_schema.sql
var pointsSchema string

const (
	sourceAMG        = "amg"
	statusPublished  = "published"
	amgMaxListPoints = 20
)

// costCheck is a query that returns the XWS ID of the first card breaking a rule, or no rows.
type costCheck struct {
	query   string
	problem string
}

// costChecks keep a points version consistent with the card tables, since foreign keys cannot.
var costChecks = []costCheck{
	{
		query:   "SELECT pilot_xws FROM pilot_costs WHERE version_id = ? AND pilot_xws NOT IN (SELECT xws FROM pilots)",
		problem: "cost for unknown pilot",
	},
	{
		query:   "SELECT xws FROM pilots WHERE xws NOT IN (SELECT pilot_xws FROM pilot_costs WHERE version_id = ?)",
		problem: "no cost for pilot",
	},
	{
		query:   "SELECT upgrade_xws FROM upgrade_costs WHERE version_id = ? AND upgrade_xws NOT IN (SELECT xws FROM upgrades)",
		problem: "cost for unknown upgrade",
	},
	{
		query: `SELECT xws FROM upgrades WHERE standard_loadout_only = 0
			AND xws NOT IN (SELECT upgrade_xws FROM upgrade_costs WHERE version_id = ?)`,
		problem: "no cost for upgrade",
	},
}

// ImportAMGPoints records points as a published AMG points version named label. Labels name the
// card data commit, so a label that already exists holds the same points: the import then changes
// nothing and returns false. Run it after ReplaceCards, since it checks costs against the cards.
func (s *Store) ImportAMGPoints(ctx context.Context, label string, points carddata.AMGPoints, now time.Time) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT 1 FROM points_versions WHERE source = ? AND label = ?)", sourceAMG, label,
	).Scan(&exists); err != nil || exists {
		return false, err
	}

	stamp := now.UTC().Format(time.RFC3339)
	res, err := tx.ExecContext(ctx, `
		INSERT INTO points_versions (source, label, max_list_points, status, created_at, status_changed_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		sourceAMG, label, amgMaxListPoints, statusPublished, stamp, stamp,
	)
	if err != nil {
		return false, fmt.Errorf("creating points version %q: %w", label, err)
	}
	versionID, err := res.LastInsertId()
	if err != nil {
		return false, err
	}

	if err := insertPilotCosts(ctx, tx, versionID, points.Pilots); err != nil {
		return false, err
	}
	if err := insertUpgradeCosts(ctx, tx, versionID, points.Upgrades); err != nil {
		return false, err
	}
	if err := checkCosts(ctx, tx, versionID); err != nil {
		return false, fmt.Errorf("points version %q: %w", label, err)
	}
	return true, tx.Commit()
}

func insertPilotCosts(ctx context.Context, tx *sql.Tx, versionID int64, costs []carddata.PilotCost) error {
	for _, c := range costs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO pilot_costs (version_id, pilot_xws, cost, loadout, slots, formats)
			VALUES (?, ?, ?, ?, ?, ?)`,
			versionID, c.PilotXWS, c.Cost, c.Loadout, toJSON(c.Slots), toJSON(c.Formats),
		); err != nil {
			return fmt.Errorf("inserting cost for pilot %q: %w", c.PilotXWS, err)
		}
	}
	return nil
}

func insertUpgradeCosts(ctx context.Context, tx *sql.Tx, versionID int64, costs []carddata.UpgradeCost) error {
	for _, c := range costs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO upgrade_costs (version_id, upgrade_xws, cost, formats) VALUES (?, ?, ?, ?)`,
			versionID, c.UpgradeXWS, c.Cost, toJSON(c.Formats),
		); err != nil {
			return fmt.Errorf("inserting cost for upgrade %q: %w", c.UpgradeXWS, err)
		}
	}
	return nil
}

func checkCosts(ctx context.Context, tx *sql.Tx, versionID int64) error {
	for _, check := range costChecks {
		var xws string
		err := tx.QueryRowContext(ctx, check.query, versionID).Scan(&xws)
		if err == sql.ErrNoRows {
			continue
		}
		if err != nil {
			return err
		}
		return fmt.Errorf("%s %q", check.problem, xws)
	}
	return nil
}
