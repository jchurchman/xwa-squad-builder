// server/src/database/schema.sql
CREATE TABLE ships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    attack INTEGER NOT NULL,
    agility INTEGER NOT NULL,
    hull INTEGER NOT NULL,
    shields INTEGER NOT NULL,
    chassis TEXT,
    factions TEXT NOT NULL,        -- JSON array: ["Rebel Alliance"]
    actions TEXT NOT NULL,         -- JSON array: ["Focus", "Lock"]  
    maneuvers TEXT NOT NULL,       -- JSON 2D array: [[0,0,0...], [0,1,1...]]
    autoequip TEXT,               -- JSON array: ["Servomotor S-Foils"]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);