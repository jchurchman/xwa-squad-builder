-- Card tables are owned by the card import, which replaces their contents on every run.
-- Rows are keyed by XWS ID so other tables can refer to cards across re-imports.

CREATE TABLE IF NOT EXISTS ships (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pilots (
  xws TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initiative INTEGER NOT NULL,
  ship_xws TEXT NOT NULL REFERENCES ships (xws),
  faction_xws TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS pilots_faction_xws ON pilots (faction_xws);
