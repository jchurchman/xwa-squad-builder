import {
  HydratedPilot,
  HydratedShip,
  HydratedUpgrade,
  Pilot,
  PilotRestrictionRow,
  PilotRow,
  Restrictions,
  Ship,
  ShipOverride,
  ShipRow,
  Upgrade,
  UpgradeRestrictionRow,
  UpgradeRow,
} from '@shared/types';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/xwing.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

export class PilotRepository {
  private insertPilot = db.prepare(`
    INSERT INTO pilots (name, ship, faction, skill, points, loadout, slots, appliesCondition, charge, chassis, engagement, force, forcerecurring, keywords, maxPerSquad, recurring, shipOverride, upgrades, xws, xwsaddon, xwsship)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllPilots = db.prepare('SELECT * FROM pilots ORDER BY name');
  private selectPilotById = db.prepare('SELECT * FROM pilots WHERE id = ?');
  private selectPilotByName = db.prepare('SELECT * FROM pilots WHERE name = ?');
  private selectPilotsByFaction = db.prepare(
    'SELECT * FROM pilots WHERE faction = ? ORDER BY name'
  );

  private selectPilotsByShip = db.prepare('SELECT * FROM pilots WHERE ship = ? ORDER BY name');

  create(pilot: Pilot): HydratedPilot {
    try {
      const result = this.insertPilot.run(
        pilot.name,
        pilot.ship,
        pilot.faction,
        pilot.skill,
        pilot.points,
        pilot.loadout,
        JSON.stringify(pilot.slots),
        pilot.appliesCondition ? JSON.stringify(pilot.appliesCondition) : null,
        pilot.charge || null,
        pilot.chassis || null,
        pilot.engagement || null,
        pilot.force || null,
        pilot.forcerecurring || null,
        pilot.keywords ? JSON.stringify(pilot.keywords) : null,
        pilot.maxPerSquad || null,
        pilot.recurring || null,
        pilot.shipOverride ? JSON.stringify(pilot.shipOverride) : null,
        pilot.upgrades ? JSON.stringify(pilot.upgrades) : null,
        pilot.xws || null,
        pilot.xwsaddon || null,
        pilot.xwsship ? 1 : 0
      );
      return this.findById(result.lastInsertRowid as number)!;
    } catch (error) {
      throw new Error(`Error creating pilot ${pilot.name}: ${error}`);
    }
  }

  findAll(): HydratedPilot[] {
    const rows = this.selectAllPilots.all() as PilotRow[];
    return rows.map((row) => this.mapRowToPilot(row));
  }

  findByFaction(faction: string): HydratedPilot[] {
    const rows = this.selectPilotsByFaction.all(faction) as PilotRow[];
    return rows.map((row) => this.mapRowToPilot(row));
  }

  findById(id: number): HydratedPilot | null {
    const row = this.selectPilotById.get(id) as PilotRow | undefined;
    if (!row) return null;
    return this.mapRowToPilot(row);
  }

  findByName(name: string): HydratedPilot | null {
    const row = this.selectPilotByName.get(name) as PilotRow | undefined;
    return row ? this.mapRowToPilot(row) : null;
  }

  findByShip(ship: string): HydratedPilot[] {
    const rows = this.selectPilotsByShip.all(ship) as PilotRow[];
    return rows.map((row) => this.mapRowToPilot(row));
  }

  private buildRestrictionsObject(restrictions: PilotRestrictionRow[]): Restrictions | undefined {
    if (restrictions.length === 0) return undefined;

    const result: Restrictions = {};
    for (const restriction of restrictions) {
      const values = JSON.parse(restriction.restriction_values);
      const key = restriction.restriction_type as keyof Restrictions;

      if (key === 'factionOrUnique') {
        result[key] = values[0];
      } else {
        result[key] = values;
      }
    }
    return result;
  }

  private mapRowToPilot(row: PilotRow): HydratedPilot {
    const restrictionRepo = new PilotRestrictionRepository();
    const restrictions = restrictionRepo.findByPilotId(row.id);

    return {
      ...row,
      appliesCondition: row.appliesCondition ? JSON.parse(row.appliesCondition) : undefined,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
      restrictions: this.buildRestrictionsObject(restrictions),
      shipOverride: row.shipOverride ? (JSON.parse(row.shipOverride) as ShipOverride) : undefined,
      slots: JSON.parse(row.slots),
      upgrades: row.upgrades ? JSON.parse(row.upgrades) : undefined,
      xwsship: row.xwsship === 1,
    };
  }
}

export class PilotRestrictionRepository {
  private insertRestriction = db.prepare(`
    INSERT INTO pilot_restrictions (pilot_id, restriction_type, operator, restriction_values)
    VALUES (?, ?, ?, ?)
  `);

  private selectByPilotId = db.prepare('SELECT * FROM pilot_restrictions WHERE pilot_id = ?');

  create(
    pilotId: number,
    restrictionType: string,
    operator: string,
    values: unknown[]
  ): PilotRestrictionRow {
    const result = this.insertRestriction.run(
      pilotId,
      restrictionType,
      operator,
      JSON.stringify(values)
    );
    return {
      id: result.lastInsertRowid as number,
      operator,
      pilot_id: pilotId,
      restriction_type: restrictionType,
      restriction_values: JSON.stringify(values),
    };
  }

  findByPilotId(pilotId: number): PilotRestrictionRow[] {
    return this.selectByPilotId.all(pilotId) as PilotRestrictionRow[];
  }
}

export class ShipRepository {
  private insertShip = db.prepare(`
    INSERT INTO ships (name, base, agility, hull, shields, actions, factions, maneuvers, attack, attackb, attackbull, attackdt, attackf, attackl, attackr, attackt, autoequip, chassis, energy, energyrecurr, icon, keyword, shieldrecurr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllShips = db.prepare('SELECT * FROM ships ORDER BY name');
  private selectShipById = db.prepare('SELECT * FROM ships WHERE id = ?');
  private selectShipByName = db.prepare('SELECT * FROM ships WHERE name = ?');

  private selectShipsByFaction = db.prepare(`
    SELECT * FROM ships WHERE factions LIKE ? ORDER BY name
  `);

  create(ship: Ship): HydratedShip {
    const result = this.insertShip.run(
      ship.name,
      ship.base || 'Small',
      ship.agility,
      ship.hull,
      ship.shields,
      JSON.stringify(ship.actions),
      JSON.stringify(ship.factions),
      JSON.stringify(ship.maneuvers),
      ship.attack || null,
      ship.attackb || null,
      ship.attackbull || null,
      ship.attackdt || null,
      ship.attackf || null,
      ship.attackl || null,
      ship.attackr || null,
      ship.attackt || null,
      ship.autoequip ? JSON.stringify(ship.autoequip) : null,
      ship.chassis || null,
      ship.energy || null,
      ship.energyrecurr || null,
      ship.icon || null,
      ship.keyword ? JSON.stringify(ship.keyword) : null,
      ship.shieldrecurr || null
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  findAll(): HydratedShip[] {
    const rows = this.selectAllShips.all() as ShipRow[];
    return rows.map(this.mapRowToShip);
  }

  findByFaction(faction: string): HydratedShip[] {
    const rows = this.selectShipsByFaction.all(`%"${faction}"%`) as ShipRow[];
    return rows.map(this.mapRowToShip);
  }

  findById(id: number): HydratedShip | null {
    const row = this.selectShipById.get(id) as ShipRow | undefined;
    return row ? this.mapRowToShip(row) : null;
  }

  findByName(name: string): HydratedShip | null {
    const row = this.selectShipByName.get(name) as ShipRow | undefined;
    return row ? this.mapRowToShip(row) : null;
  }

  private mapRowToShip(row: ShipRow): HydratedShip {
    return {
      ...row,
      actions: JSON.parse(row.actions),
      autoequip: row.autoequip ? JSON.parse(row.autoequip) : undefined,
      factions: JSON.parse(row.factions),
      keyword: row.keyword ? JSON.parse(row.keyword) : undefined,
      maneuvers: JSON.parse(row.maneuvers),
    };
  }
}

export class UpgradeRepository {
  private insertUpgrade = db.prepare(`
    INSERT INTO upgrades (name, shipOverride, appliesCondition, charge, chassis, force, forcerecurring, keywords, maxPerSquad, points, recurring, ship, xws, xwsaddon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllUpgrades = db.prepare('SELECT * FROM upgrades ORDER BY name');
  private selectUpgradeById = db.prepare('SELECT * FROM upgrades WHERE id = ?');

  create(upgrade: Upgrade): HydratedUpgrade {
    try {
      const result = this.insertUpgrade.run(
        upgrade.name,
        JSON.stringify(upgrade.shipOverride),
        upgrade.appliesCondition ? JSON.stringify(upgrade.appliesCondition) : null,
        upgrade.charge || null,
        upgrade.chassis || null,
        upgrade.force || null,
        upgrade.forcerecurring || null,
        upgrade.keywords ? JSON.stringify(upgrade.keywords) : null,
        upgrade.maxPerSquad || null,
        upgrade.points || null,
        upgrade.recurring || null,
        upgrade.ship ? JSON.stringify(upgrade.ship) : null,
        upgrade.xws || null,
        upgrade.xwsaddon || null
      );
      return this.findById(result.lastInsertRowid as number)!;
    } catch (error) {
      throw new Error(`Error creating upgrade ${upgrade.name}: ${error}`);
    }
  }

  findAll(): HydratedUpgrade[] {
    const rows = this.selectAllUpgrades.all() as UpgradeRow[];
    return rows.map((row) => this.mapRowToUpgrade(row));
  }

  findByFirstSlot(slotType: string): HydratedUpgrade[] {
    const allUpgrades = this.findAll();

    return allUpgrades.filter((upgrade) => {
      const slotRestrictions = upgrade.upgradeRestrictions?.slots;
      if (!slotRestrictions) return true;

      return slotRestrictions[0] === slotType;
    });
  }

  findById(id: number): HydratedUpgrade | null {
    const row = this.selectUpgradeById.get(id) as undefined | UpgradeRow;
    if (!row) return null;
    return this.mapRowToUpgrade(row);
  }

  findBySlot(slotType: string): HydratedUpgrade[] {
    const allUpgrades = this.findAll();

    return allUpgrades.filter((upgrade) => {
      const slotRestrictions = upgrade.upgradeRestrictions?.slots;
      if (!slotRestrictions) return true;

      return slotRestrictions.includes(slotType);
    });
  }

  private buildRestrictionsObject(restrictions: UpgradeRestrictionRow[]): Restrictions {
    const result: Restrictions = {};
    for (const restriction of restrictions) {
      const values = JSON.parse(restriction.restriction_values);
      const key = restriction.restriction_type as keyof Restrictions;

      if (key === 'factionOrUnique') {
        result[key] = values[0];
      } else {
        result[key] = values;
      }
    }
    return result;
  }

  private mapRowToUpgrade(row: UpgradeRow): HydratedUpgrade {
    const restrictionRepo = new UpgradeRestrictionRepository();
    const restrictions = restrictionRepo.findByUpgradeId(row.id);

    return {
      ...row,
      appliesCondition: row.appliesCondition ? JSON.parse(row.appliesCondition) : undefined,
      keywords: row.keywords ? JSON.parse(row.keywords) : undefined,
      ship: row.ship ? JSON.parse(row.ship) : undefined,
      shipOverride: JSON.parse(row.shipOverride) as ShipOverride,
      upgradeRestrictions: this.buildRestrictionsObject(restrictions),
    };
  }
}

export class UpgradeRestrictionRepository {
  private insertRestriction = db.prepare(`
    INSERT INTO upgrade_restrictions (upgrade_id, restriction_type, operator, restriction_values)
    VALUES (?, ?, ?, ?)
  `);

  private selectByUpgradeId = db.prepare('SELECT * FROM upgrade_restrictions WHERE upgrade_id = ?');

  create(
    upgradeId: number,
    restrictionType: string,
    operator: string,
    values: unknown[]
  ): UpgradeRestrictionRow {
    const result = this.insertRestriction.run(
      upgradeId,
      restrictionType,
      operator,
      JSON.stringify(values)
    );
    return {
      id: result.lastInsertRowid as number,
      operator,
      restriction_type: restrictionType,
      restriction_values: JSON.stringify(values),
      upgrade_id: upgradeId,
    };
  }

  findByUpgradeId(upgradeId: number): UpgradeRestrictionRow[] {
    return this.selectByUpgradeId.all(upgradeId) as UpgradeRestrictionRow[];
  }
}

export function initializeDatabase() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);
  console.log('Database initialized successfully');
}

export { db };
