CREATE TABLE IF NOT EXISTS ships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    attack INTEGER,
    attack_bull INTEGER,
    attack_t INTEGER,
    attack_dt INTEGER,
    attack_f INTEGER,
    agility INTEGER NOT NULL,
    base TEXT,
    hull INTEGER NOT NULL,
    shields INTEGER NOT NULL,
    chassis TEXT,
    factions TEXT NOT NULL,        -- JSON array: ["Rebel Alliance"]
    actions TEXT NOT NULL,         -- JSON array: ["Focus", "Lock"]  
    maneuvers TEXT NOT NULL,       -- JSON 2D array: [[0,0,0...], [0,1,1...]]
    autoequip TEXT,               -- JSON array: ["Servomotor S-Foils"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pilots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  faction VARCHAR(100) NOT NULL,
  ship VARCHAR(255) NOT NULL,
  skill INTEGER NOT NULL,
  points INTEGER NOT NULL,
  loadout INTEGER,
  max_per_squad INTEGER,
  force INTEGER,
  charge INTEGER,
  recurring INTEGER,
  keyword TEXT[], -- Array of keywords like ["Clone"]
  slots TEXT[], -- Array of slot types
  applies_condition VARCHAR(255),
  chassis VARCHAR(255),
  ship_override JSONB, -- For overriding ship stats like attackdt
  upgrades TEXT[], -- For pre-equipped upgrades
  xws_addon VARCHAR(100) -- For special releases like "swz106"
);