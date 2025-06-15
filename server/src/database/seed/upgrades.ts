import { Upgrade, ShipOverride, Restrictions } from '../types';
import { notNil } from './common';

type ImportedUpgrade = {
  also_occupies_upgrades?: string[];
  also_occupies_upgrades_xwa?: string[];
  applies_condition?: string | string[];
  attack?: number;
  attackb?: number;
  attackbull?: number;
  attackdt?: number;
  attackf?: number;
  attackt?: number;
  charge?: number;
  chassis?: string;
  confersAddons?: { slot: string }[];
  faction?: string[];
  force?: number;
  forcerecurring?: number;
  keyword?: string[];
  max_per_squad?: number;
  modifier_func?: (arg: ShipOverride) => ShipOverride;
  name: string;
  points?: number;
  pointsxwa?: number;
  range?: string;
  rangebonus?: boolean;
  recurring?: number | boolean;
  restrictions?: (string | number)[][];
  restrictionsxwa?: string[][];
  ship?: string;
  skip?: boolean;
  slot: string;
  solitary?: boolean;
  standard?: true;
  standardized?: boolean;
  standardizedxwa?: boolean;
  unequips_upgrades?: string[];
  unique?: boolean;
  xws?: string;
  xwsaddon?: string;
};

export function transformUpgradesForDb(
  rawUpgrades: ImportedUpgrade[]
): Omit<Upgrade, 'id' | 'created_at'>[] {
  return rawUpgrades.reduce(
    (transformed, upgrade) => {
      const {
        applies_condition,
        charge,
        chassis,
        force,
        forcerecurring,
        keyword,
        max_per_squad,
        name,
        points,
        pointsxwa,
        recurring,
        ship,
        skip,
        unique,
        xws,
        xwsaddon,
      } = upgrade;

      if (skip) {
        return transformed;
      }

      const upgradeRestrictions = buildUpgradeRestrictions(upgrade);

      const shipOverride = buildShipOverride(upgrade);

      const newUpgrade: Omit<Upgrade, 'id' | 'created_at'> = {
        ...(notNil(applies_condition) && {
          appliesCondition: Array.isArray(applies_condition)
            ? applies_condition
            : [applies_condition],
        }),
        ...(notNil(charge) && { charge }),
        ...(notNil(chassis) && { chassis }),
        ...(notNil(force) && { force }),
        ...(notNil(forcerecurring) && { forcerecurring }),
        ...(notNil(keyword) && { keywords: keyword }),
        ...((notNil(unique) || notNil(max_per_squad)) && {
          maxPerSquad: unique ? 1 : max_per_squad,
        }),
        name,
        points: notNil(pointsxwa) ? pointsxwa : points,
        ...(notNil(recurring) && { recurring: Number(recurring) }),
        ...(notNil(ship) && { ship: Array.isArray(ship) ? ship : [ship] }),
        ...(notNil(xws) && { xws }),
        ...(notNil(xwsaddon) && { xwsaddon }),
        shipOverride,
        upgradeRestrictions,
      };

      transformed.push(newUpgrade);

      return transformed;
    },
    [] as Omit<Upgrade, 'id' | 'created_at'>[]
  );
}

function buildUpgradeRestrictions(rawUpgrade: ImportedUpgrade) {
  const {
    also_occupies_upgrades,
    also_occupies_upgrades_xwa,
    faction,
    max_per_squad,
    restrictions: rawRestrictions,
    restrictionsxwa,
    slot,
    solitary,
    unique,
  } = rawUpgrade;

  let restrictions: Restrictions = {
    slots: [slot],
    ...(notNil(solitary) && { solitary }),
    ...((notNil(unique) || notNil(max_per_squad)) && {
      maxPerSquad: unique ? 1 : max_per_squad,
    }),
    ...(notNil(faction) && { faction }),
  };

  if (notNil(also_occupies_upgrades) || notNil(also_occupies_upgrades_xwa)) {
    restrictions.slots!.concat(
      also_occupies_upgrades_xwa! || also_occupies_upgrades!
    );
  }

  if (notNil(restrictionsxwa)) {
    const thing = manageRawRestrictions(restrictionsxwa);
    restrictions = Object.assign(restrictions, thing);
  } else if (notNil(rawRestrictions)) {
    const thing = manageRawRestrictions(rawRestrictions);
    restrictions = Object.assign(restrictions, thing);
  }

  return restrictions;
}

function manageRawRestrictions(
  raw: (string | number)[][]
): Partial<Restrictions> {
  const returnObj: Partial<Restrictions> = {};

  raw?.forEach((res) => {
    const [condition, ...values] = res;
    if (condition === 'Slot') {
      return;
    }
    if (condition === 'isUnique' && values[0]) {
      returnObj.maxPerSquad = 1;
    }
    if (condition === 'Action') {
      returnObj.action = values as string[];
    }
    if (condition === 'AttackArc') {
      returnObj.attackArc = values[0] as string;
    }
    if (condition === 'Base') {
      // TODO: Handle "Standard" bases :shrug:
      if (values[0] === 'Non-Small') {
        returnObj.base = ['Medium', 'Large', 'Huge'];
      } else {
        returnObj.base = values as string[];
      }
    }
    if (condition === 'Keyword') {
      if (
        [
          'Networked Calculations',
          'Vectored Thrusters',
          'Autothrusters',
        ].includes(values[0] as string)
      ) {
        returnObj.chassis = values[0] as string;
      }
    }
    if (condition === 'ShieldsGreaterThan') {
      returnObj.minShield = (values[0] as number) + 1;
    }
    if (condition === 'InitiativeGreaterThan') {
      returnObj.minSkill = (values[0] as number) + 1;
    }
    if (condition === 'EnergyGreatterThan') {
      returnObj.minEnergy = (values[0] as number) + 1;
    }
    if (condition === 'AgilityEquals') {
      returnObj.agility = values[0] as number;
    }
    if (condition === 'InitiativeLessThan') {
      returnObj.maxSkill = (values[0] as number) - 1;
    }
    if (condition === 'Equipped') {
      returnObj.slotEquipped = values as string[];
    }
    if (condition === 'FactionOrUnique') {
      returnObj.factionOrUnique = {
        faction: values[1] as string,
        uniqueName: values[0] as string,
      };
    }
  });

  return returnObj;
}

const maneuversBlank = [
  // lt, lb, s, rb, rt, kt, lsloop, rsloop, ltalon, rtalon
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // stops
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 1 speed
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 2 speed
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 3 speed
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 4 speed
  [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // 5 speed
];

const blankShipForModifierFunc: ShipOverride = {
  actions: [],
  agility: 50,
  attack: 50,
  energy: 50,
  force: 50,
  hull: 50,
  maneuvers: maneuversBlank,
  shields: 50,
};

type OverrideNumKeys =
  | 'agility'
  | 'attack'
  | 'energy'
  | 'force'
  | 'hull'
  | 'shields';

function buildShipOverride(upgrade: ImportedUpgrade): ShipOverride {
  const {
    attack,
    attackb,
    attackbull,
    attackdt,
    attackf,
    attackt,
    confersAddons,
    modifier_func,
    name,
    range,
    rangebonus,
    unequips_upgrades,
  } = upgrade;

  const returnObj: ShipOverride = {
    ...(notNil(attack) && { attack }),
    ...(notNil(attackb) && { attackb }),
    ...(notNil(attackbull) && { attackbull }),
    ...(notNil(attackdt) && { attackdt }),
    ...(notNil(attackf) && { attackf }),
    ...(notNil(attackt) && { attackt }),
    ...(notNil(rangebonus) && { rangebonus }),
  };

  if (notNil(confersAddons) && confersAddons.length) {
    returnObj.addSlots = confersAddons.map((addon) => addon.slot);
  }
  if (notNil(unequips_upgrades) && unequips_upgrades.length) {
    returnObj.removeSlots = unequips_upgrades;
  }
  if (notNil(range)) {
    const splitRawRangeBonus = range.split('-');
    returnObj.range = [
      parseInt(splitRawRangeBonus[0]),
      parseInt(splitRawRangeBonus[splitRawRangeBonus.length - 1]),
    ];
  }
  if (notNil(modifier_func)) {
    const { actions, attackt, maneuvers, ...rest } =
      modifier_func(blankShipForModifierFunc) || {};

    if (attackt && name.includes('Vectored')) {
      // Have to do this manually because of the way the modifier_func
      // is coded in the CoffeeScript
      returnObj.attack = -2;
      returnObj.attackt = 2;
    }
    if (notNil(maneuvers)) {
      const maneuverAdjustment = maneuvers?.map((row) => {
        return row.map((speed) => speed - 3);
      });
      returnObj.maneuvers = maneuverAdjustment;
    }
    if (notNil(actions) && actions.length) {
      returnObj.actions = actions;
    }

    Object.entries(rest as Pick<ShipOverride, OverrideNumKeys>).forEach(
      ([k, v]) => {
        const newVal = v - 9;
        if (newVal) {
          returnObj[k as OverrideNumKeys] = newVal;
        }
      }
    );
  }

  return returnObj;
}
