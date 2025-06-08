import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(__dirname, '../../data/xwing.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Initialize database with schema
export function initializeDatabase() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

// Ship interface based on schema
export interface Ship {
  id?: number;
  name: string;
  attack: number;
  agility: number;
  hull: number;
  shields: number;
  chassis?: string;
  factions: string[];
  actions: string[];
  maneuvers: number[][];
  autoequip?: string[];
  created_at?: string;
}

// Ship database operations
export class ShipRepository {
  private insertShip = db.prepare(`
    INSERT INTO ships (name, attack, agility, hull, shields, chassis, factions, actions, maneuvers, autoequip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllShips = db.prepare('SELECT * FROM ships ORDER BY name');
  private selectShipById = db.prepare('SELECT * FROM ships WHERE id = ?');
  private selectShipsByFaction = db.prepare(`
    SELECT * FROM ships WHERE factions LIKE ? ORDER BY name
  `);

  create(ship: Omit<Ship, 'id' | 'created_at'>): Ship {
    const result = this.insertShip.run(
      ship.name,
      ship.attack,
      ship.agility,
      ship.hull,
      ship.shields,
      ship.chassis || null,
      JSON.stringify(ship.factions),
      JSON.stringify(ship.actions),
      JSON.stringify(ship.maneuvers),
      ship.autoequip ? JSON.stringify(ship.autoequip) : null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findAll(): Ship[] {
    const rows = this.selectAllShips.all();
    return rows.map(this.mapRowToShip);
  }

  findById(id: number): Ship | null {
    const row = this.selectShipById.get(id);
    return row ? this.mapRowToShip(row) : null;
  }

  findByFaction(faction: string): Ship[] {
    const rows = this.selectShipsByFaction.all(`%"${faction}"%`);
    return rows.map(this.mapRowToShip);
  }

  private mapRowToShip(row: any): Ship {
    return {
      id: row.id,
      name: row.name,
      attack: row.attack,
      agility: row.agility,
      hull: row.hull,
      shields: row.shields,
      chassis: row.chassis,
      factions: JSON.parse(row.factions),
      actions: JSON.parse(row.actions),
      maneuvers: JSON.parse(row.maneuvers),
      autoequip: row.autoequip ? JSON.parse(row.autoequip) : undefined,
      created_at: row.created_at
    };
  }
}

export { db };