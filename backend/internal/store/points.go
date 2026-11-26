package store

import (
	"context"
	"database/sql"
	_ "embed"
	"errors"
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
	sourceXWA        = "xwa"
	statusPublished  = "published"
	amgMaxListPoints = 20
	xwaMaxListPoints = 50
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
	return s.importPublishedPoints(ctx, sourceAMG, amgMaxListPoints, label, points.Pilots, points.Upgrades, now)
}

// ImportXWAPoints records XWA points as a published XWA points version named label, with XWA's
// 50-point list size. Like ImportAMGPoints, labels name the commit the points came from, so a label
// that already exists changes nothing and returns false.
//
// Temporary: until XWA's points team edits drafts here (D4), XWA points come from YASB, published
// as-is.
func (s *Store) ImportXWAPoints(
	ctx context.Context, label string, pilots []carddata.PilotCost, upgrades []carddata.UpgradeCost, now time.Time,
) (bool, error) {
	return s.importPublishedPoints(ctx, sourceXWA, xwaMaxListPoints, label, pilots, upgrades, now)
}

func (s *Store) importPublishedPoints(
	ctx context.Context, source string, maxListPoints int, label string,
	pilots []carddata.PilotCost, upgrades []carddata.UpgradeCost, now time.Time,
) (bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	var exists bool
	if err := tx.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT 1 FROM points_versions WHERE source = ? AND label = ?)", source, label,
	).Scan(&exists); err != nil || exists {
		return false, err
	}

	stamp := now.UTC().Format(time.RFC3339)
	res, err := tx.ExecContext(ctx, `
		INSERT INTO points_versions (source, label, max_list_points, status, created_at, status_changed_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
		source, label, maxListPoints, statusPublished, stamp, stamp,
	)
	if err != nil {
		return false, fmt.Errorf("creating points version %q: %w", label, err)
	}
	versionID, err := res.LastInsertId()
	if err != nil {
		return false, err
	}

	if err := insertPilotCosts(ctx, tx, versionID, pilots); err != nil {
		return false, err
	}
	if err := insertUpgradeCosts(ctx, tx, versionID, upgrades); err != nil {
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
			INSERT INTO upgrade_costs (version_id, upgrade_xws, faction, cost, formats) VALUES (?, ?, ?, ?, ?)`,
			versionID, c.UpgradeXWS, c.FactionXWS, c.Cost, toJSON(c.Formats),
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

// ErrNoPointsVersion means a source has no published points version yet.
var ErrNoPointsVersion = errors.New("no published points version")

// PointsVersion is one points version with all of its costs.
type PointsVersion struct {
	Source        string
	Label         string
	EffectiveDate string
	MaxListPoints int
	Pilots        []carddata.PilotCost
	Upgrades      []carddata.UpgradeCost
}

// LatestPublishedPointsVersion returns source's most recently published points version, or
// ErrNoPointsVersion if it has none.
func (s *Store) LatestPublishedPointsVersion(ctx context.Context, source string) (*PointsVersion, error) {
	v := &PointsVersion{Source: source}
	var id int64
	var effectiveDate sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT id, label, effective_date, max_list_points FROM points_versions
		WHERE source = ? AND status = ?
		ORDER BY status_changed_at DESC, id DESC
		LIMIT 1`, source, statusPublished,
	).Scan(&id, &v.Label, &effectiveDate, &v.MaxListPoints)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNoPointsVersion
	}
	if err != nil {
		return nil, err
	}
	v.EffectiveDate = effectiveDate.String

	if v.Pilots, err = listPilotCosts(ctx, s.db, id); err != nil {
		return nil, err
	}
	if v.Upgrades, err = listUpgradeCosts(ctx, s.db, id); err != nil {
		return nil, err
	}
	return v, nil
}

func listPilotCosts(ctx context.Context, db *sql.DB, versionID int64) ([]carddata.PilotCost, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT pilot_xws, cost, loadout, slots, formats FROM pilot_costs
		WHERE version_id = ? ORDER BY pilot_xws`, versionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var costs []carddata.PilotCost
	for rows.Next() {
		var c carddata.PilotCost
		var slots, formats string
		if err := rows.Scan(&c.PilotXWS, &c.Cost, &c.Loadout, &slots, &formats); err != nil {
			return nil, err
		}
		if err := decodeJSONColumns(jsonColumn{slots, &c.Slots}, jsonColumn{formats, &c.Formats}); err != nil {
			return nil, fmt.Errorf("pilot cost %q: %w", c.PilotXWS, err)
		}
		costs = append(costs, c)
	}
	return costs, rows.Err()
}

func listUpgradeCosts(ctx context.Context, db *sql.DB, versionID int64) ([]carddata.UpgradeCost, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT upgrade_xws, faction, cost, formats FROM upgrade_costs
		WHERE version_id = ? ORDER BY upgrade_xws, faction`, versionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var costs []carddata.UpgradeCost
	for rows.Next() {
		var c carddata.UpgradeCost
		var formats string
		if err := rows.Scan(&c.UpgradeXWS, &c.FactionXWS, &c.Cost, &formats); err != nil {
			return nil, err
		}
		if err := decodeJSONColumns(jsonColumn{formats, &c.Formats}); err != nil {
			return nil, fmt.Errorf("upgrade cost %q: %w", c.UpgradeXWS, err)
		}
		costs = append(costs, c)
	}
	return costs, rows.Err()
}
