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
export interface Pilot {
  id?: number;
  name: string;
  faction: string;
  ship: string;
  skill: number;
  points: number;
  loadout?: number;
  max_per_squad?: number;
  force?: number;
  charge?: number;
  recurring?: number;
  keyword?: string[];
  slots?: string[];
  applies_condition?: string;
  chassis?: string;
  ship_override?: Record<string, any>;
  upgrades?: string[];
  xws_addon?: string;
  created_at?: string;
}

export class PilotRepository {
  private insertPilot = db.prepare(`
    INSERT INTO pilots (
      name, faction, ship, skill, points, loadout, max_per_squad,
      force, charge, recurring, keyword, slots, applies_condition,
      chassis, ship_override, upgrades, xws_addon
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllPilots = db.prepare('SELECT * FROM pilots ORDER BY name');
  private selectPilotById = db.prepare('SELECT * FROM pilots WHERE id = ?');
  private selectPilotByName = db.prepare('SELECT * FROM pilots WHERE name = ?');
  private selectPilotsByFaction = db.prepare('SELECT * FROM pilots WHERE faction = ? ORDER BY name');
  private selectPilotsByShip = db.prepare('SELECT * FROM pilots WHERE ship = ? ORDER BY name');
  private selectPilotsBySkillRange = db.prepare('SELECT * FROM pilots WHERE skill BETWEEN ? AND ? ORDER BY skill, name');

  create(pilot: Omit<Pilot, 'id' | 'created_at'>): Pilot {
    const result = this.insertPilot.run(
      pilot.name,
      pilot.faction,
      pilot.ship,
      pilot.skill,
      pilot.points,
      pilot.loadout || null,
      pilot.max_per_squad || null,
      pilot.force || null,
      pilot.charge || null,
      pilot.recurring || null,
      pilot.keyword ? JSON.stringify(pilot.keyword) : null,
      pilot.slots ? JSON.stringify(pilot.slots) : null,
      pilot.applies_condition || null,
      pilot.chassis || null,
      pilot.ship_override ? JSON.stringify(pilot.ship_override) : null,
      pilot.upgrades ? JSON.stringify(pilot.upgrades) : null,
      pilot.xws_addon || null
    );

    return this.findById(result.lastInsertRowid as number)!;
  }

  findAll(): Pilot[] {
    const rows = this.selectAllPilots.all();
    return rows.map(this.mapRowToPilot);
  }

  findById(id: number): Pilot | null {
    const row = this.selectPilotById.get(id);
    return row ? this.mapRowToPilot(row) : null;
  }

  findByName(name: string): Pilot | null {
    const row = this.selectPilotByName.get(name);
    return row ? this.mapRowToPilot(row) : null;
  }

  findByFaction(faction: string): Pilot[] {
    const rows = this.selectPilotsByFaction.all(faction);
    return rows.map(this.mapRowToPilot);
  }

  findByShip(ship: string): Pilot[] {
    const rows = this.selectPilotsByShip.all(ship);
    return rows.map(this.mapRowToPilot);
  }

  findBySkillRange(minSkill: number, maxSkill: number): Pilot[] {
    const rows = this.selectPilotsBySkillRange.all(minSkill, maxSkill);
    return rows.map(this.mapRowToPilot);
  }

  private mapRowToPilot(row: any): Pilot {
    return {
      id: row.id,
      name: row.name,
      faction: row.faction,
      ship: row.ship,
      skill: row.skill,
      points: row.points,
      loadout: row.loadout,
      max_per_squad: row.max_per_squad,
      force: row.force,
      charge: row.charge,
      recurring: row.recurring,
      keyword: row.keyword ? JSON.parse(row.keyword) : undefined,
      slots: row.slots ? JSON.parse(row.slots) : undefined,
      applies_condition: row.applies_condition,
      chassis: row.chassis,
      ship_override: row.ship_override ? JSON.parse(row.ship_override) : undefined,
      upgrades: row.upgrades ? JSON.parse(row.upgrades) : undefined,
      xws_addon: row.xws_addon,
      created_at: row.created_at
    };
  }
}

export { db };