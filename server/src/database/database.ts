import {
  HydratedPilot,
  HydratedPlatform,
  HydratedUpgrade,
  Pilot,
  PilotRestrictionRow,
  PilotRow,
  Platform,
  PlatformOverride,
  PlatformRow,
  Restrictions,
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
    INSERT INTO pilots (name, platform, faction, skill, points, loadout, slots, appliesCondition, charge, chassis, engagement, force, forcerecurring, keywords, maxPerSquad, recurring, platformOverride, upgrades, xws, xwsaddon, xwsship)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllPilots = db.prepare('SELECT * FROM pilots ORDER BY name');
  private selectPilotById = db.prepare('SELECT * FROM pilots WHERE id = ?');
  private selectPilotByName = db.prepare('SELECT * FROM pilots WHERE name = ?');
  private selectPilotsByFaction = db.prepare(
    'SELECT * FROM pilots WHERE faction = ? ORDER BY name'
  );

  private selectPilotsByPlatform = db.prepare(
    'SELECT * FROM pilots WHERE platform = ? ORDER BY name'
  );

  create(pilot: Pilot): HydratedPilot {
    try {
      const result = this.insertPilot.run(
        pilot.name,
        pilot.platform,
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
        pilot.platformOverride ? JSON.stringify(pilot.platformOverride) : null,
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

  findByPlatform(platform: string): HydratedPilot[] {
    const rows = this.selectPilotsByPlatform.all(platform) as PilotRow[];
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
      platformOverride: row.platformOverride
        ? (JSON.parse(row.platformOverride) as PlatformOverride)
        : undefined,
      restrictions: this.buildRestrictionsObject(restrictions),
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

export class PlatformRepository {
  private insertPlatform = db.prepare(`
    INSERT INTO platforms (name, base, agility, hull, shields, actions, factions, maneuvers, attack, attackb, attackbull, attackdt, attackf, attackl, attackr, attackt, autoequip, chassis, energy, energyrecurr, icon, keyword, shieldrecurr)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllPlatforms = db.prepare('SELECT * FROM platforms ORDER BY name');
  private selectPlatformById = db.prepare('SELECT * FROM platforms WHERE id = ?');
  private selectPlatformByName = db.prepare('SELECT * FROM platforms WHERE name = ?');

  private selectPlatformsByFaction = db.prepare(`
    SELECT * FROM platforms WHERE factions LIKE ? ORDER BY name
  `);

  create(platform: Platform): HydratedPlatform {
    const result = this.insertPlatform.run(
      platform.name,
      platform.base || 'Small',
      platform.agility,
      platform.hull,
      platform.shields,
      JSON.stringify(platform.actions),
      JSON.stringify(platform.factions),
      JSON.stringify(platform.maneuvers),
      platform.attack || null,
      platform.attackb || null,
      platform.attackbull || null,
      platform.attackdt || null,
      platform.attackf || null,
      platform.attackl || null,
      platform.attackr || null,
      platform.attackt || null,
      platform.autoequip ? JSON.stringify(platform.autoequip) : null,
      platform.chassis || null,
      platform.energy || null,
      platform.energyrecurr || null,
      platform.icon || null,
      platform.keyword ? JSON.stringify(platform.keyword) : null,
      platform.shieldrecurr || null
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  findAll(): HydratedPlatform[] {
    const rows = this.selectAllPlatforms.all() as PlatformRow[];
    return rows.map(this.mapRowToPlatform);
  }

  findByFaction(faction: string): HydratedPlatform[] {
    const rows = this.selectPlatformsByFaction.all(`%"${faction}"%`) as PlatformRow[];
    return rows.map(this.mapRowToPlatform);
  }

  findById(id: number): HydratedPlatform | null {
    const row = this.selectPlatformById.get(id) as PlatformRow | undefined;
    return row ? this.mapRowToPlatform(row) : null;
  }

  findByName(name: string): HydratedPlatform | null {
    const row = this.selectPlatformByName.get(name) as PlatformRow | undefined;
    return row ? this.mapRowToPlatform(row) : null;
  }

  private mapRowToPlatform(row: PlatformRow): HydratedPlatform {
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
    INSERT INTO upgrades (name, platformOverride, appliesCondition, charge, chassis, force, forcerecurring, keywords, maxPerSquad, points, recurring, platform, xws, xwsaddon)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  private selectAllUpgrades = db.prepare('SELECT * FROM upgrades ORDER BY name');
  private selectUpgradeById = db.prepare('SELECT * FROM upgrades WHERE id = ?');

  create(upgrade: Upgrade): HydratedUpgrade {
    try {
      const result = this.insertUpgrade.run(
        upgrade.name,
        JSON.stringify(upgrade.platformOverride),
        upgrade.appliesCondition ? JSON.stringify(upgrade.appliesCondition) : null,
        upgrade.charge || null,
        upgrade.chassis || null,
        upgrade.force || null,
        upgrade.forcerecurring || null,
        upgrade.keywords ? JSON.stringify(upgrade.keywords) : null,
        upgrade.maxPerSquad || null,
        upgrade.points || null,
        upgrade.recurring || null,
        upgrade.platform ? JSON.stringify(upgrade.platform) : null,
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
      platform: row.platform ? JSON.parse(row.platform) : undefined,
      platformOverride: JSON.parse(row.platformOverride) as PlatformOverride,
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
