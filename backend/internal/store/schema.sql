-- Card tables are owned by the card import, which drops and recreates them on every run, so
-- changing this file needs no migration: re-run the import.
-- Rows are keyed by XWS ID so other tables can refer to cards across re-imports.
-- List-valued columns hold JSON arrays.

DROP TABLE IF EXISTS pilots;
DROP TABLE IF EXISTS ships;

CREATE TABLE ships (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  actions TEXT NOT NULL,
  arcs TEXT NOT NULL
);

CREATE TABLE pilots (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL,
  limited INTEGER NOT NULL,
  ship_xws TEXT NOT NULL REFERENCES ships (xws),
  faction_xws TEXT NOT NULL,
  slots TEXT NOT NULL,
  standard_loadout TEXT NOT NULL,
  keywords TEXT NOT NULL,
  ship_ability TEXT NOT NULL,
  ship_actions TEXT NOT NULL,
  force_sides TEXT NOT NULL
);

CREATE INDEX pilots_faction_xws ON pilots (faction_xws);
