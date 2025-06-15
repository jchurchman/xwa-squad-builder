-- Ships table (unchanged)
CREATE TABLE IF NOT EXISTS ships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  base TEXT NOT NULL,
  agility INTEGER NOT NULL,
  hull INTEGER NOT NULL,
  shields INTEGER NOT NULL,
  actions TEXT NOT NULL, -- JSON array
  factions TEXT NOT NULL, -- JSON array
  maneuvers TEXT NOT NULL, -- JSON array of arrays
  attack INTEGER,
  attackb INTEGER,
  attackbull INTEGER,
  attackdt INTEGER,
  attackf INTEGER,
  attackl INTEGER,
  attackr INTEGER,
  attackt INTEGER,
  autoequip TEXT, -- JSON array
  chassis TEXT,
  energy INTEGER,
  energyrecurr INTEGER,
  icon TEXT,
  keyword TEXT, -- JSON array
  shieldrecurr INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pilots table (remove restrictions, keep shipOverride as JSON)
CREATE TABLE IF NOT EXISTS pilots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ship TEXT NOT NULL,
  faction TEXT NOT NULL,
  skill INTEGER NOT NULL,
  points INTEGER NOT NULL,
  loadout INTEGER NOT NULL,
  slots TEXT NOT NULL, -- JSON array
  appliesCondition TEXT, -- JSON array
  charge INTEGER,
  chassis TEXT,
  engagement INTEGER,
  force INTEGER,
  forcerecurring INTEGER,
  keywords TEXT, -- JSON array
  maxPerSquad INTEGER,
  recurring INTEGER,
  shipOverride TEXT, -- JSON object
  upgrades TEXT, -- JSON array
  xws TEXT,
  xwsaddon TEXT,
  xwsship INTEGER, -- SQLite boolean (0/1)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Upgrades table (remove upgradeRestrictions, keep shipOverride as JSON)
CREATE TABLE IF NOT EXISTS upgrades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  shipOverride TEXT NOT NULL, -- JSON object
  appliesCondition TEXT, -- JSON array
  charge INTEGER,
  chassis TEXT,
  force INTEGER,
  forcerecurring INTEGER,
  keywords TEXT, -- JSON array
  maxPerSquad INTEGER,
  points INTEGER,
  recurring INTEGER,
  ship TEXT, -- JSON array
  xws TEXT,
  xwsaddon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pilot restrictions
CREATE TABLE IF NOT EXISTS pilot_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pilot_id INTEGER NOT NULL,
  restriction_type TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT 'equals',
  restriction_values TEXT NOT NULL, -- JSON array
  FOREIGN KEY (pilot_id) REFERENCES pilots(id)
);

-- Upgrade restrictions
CREATE TABLE IF NOT EXISTS upgrade_restrictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  upgrade_id INTEGER NOT NULL,
  restriction_type TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT 'equals',
  restriction_values TEXT NOT NULL, -- JSON array
  FOREIGN KEY (upgrade_id) REFERENCES upgrades(id)
);