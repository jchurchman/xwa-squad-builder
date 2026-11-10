-- Card tables are owned by the card import, which drops and recreates them on every run, so
-- changing this file needs no migration: re-run the import.
-- Rows are keyed by XWS ID so other tables can refer to cards across re-imports.

DROP TABLE IF EXISTS pilots;
DROP TABLE IF EXISTS ships;

CREATE TABLE ships (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE pilots (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL,
  ship_xws TEXT NOT NULL REFERENCES ships (xws),
  faction_xws TEXT NOT NULL
);

CREATE INDEX pilots_faction_xws ON pilots (faction_xws);
