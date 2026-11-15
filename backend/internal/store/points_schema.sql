-- Points tables hold points versions (docs/architecture.md, D4). Unlike the card tables they are
-- never dropped, so changing a table here needs a migration.
-- Costs refer to cards by XWS ID without foreign keys, because the card import drops and recreates
-- the card tables. The points import checks the IDs instead.
-- List-valued columns hold JSON arrays.

CREATE TABLE IF NOT EXISTS points_versions (
  id INTEGER PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('amg', 'xwa')),
  label TEXT NOT NULL,
  effective_date TEXT,
  max_list_points INTEGER NOT NULL CHECK (max_list_points > 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'testing', 'published')),
  based_on_version_id INTEGER REFERENCES points_versions (id),
  created_at TEXT NOT NULL,
  status_changed_at TEXT NOT NULL,
  UNIQUE (source, label)
);

CREATE TABLE IF NOT EXISTS pilot_costs (
  version_id INTEGER NOT NULL REFERENCES points_versions (id),
  pilot_xws TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  loadout INTEGER NOT NULL CHECK (loadout >= 0),
  slots TEXT NOT NULL,
  formats TEXT NOT NULL,
  PRIMARY KEY (version_id, pilot_xws)
);

-- An empty faction applies to every faction; a named faction overrides it for that faction.
-- A NULL cost means the source never priced the upgrade (e.g. AMG's "?"); it is legal in no format.
CREATE TABLE IF NOT EXISTS upgrade_costs (
  version_id INTEGER NOT NULL REFERENCES points_versions (id),
  upgrade_xws TEXT NOT NULL,
  faction TEXT NOT NULL DEFAULT '',
  cost INTEGER CHECK (cost >= 0),
  formats TEXT NOT NULL,
  PRIMARY KEY (version_id, upgrade_xws, faction)
);
