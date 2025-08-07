import {
  Faction,
  HydratedPilot,
  HydratedPlatform,
  HydratedUpgrade,
  RestrictionKey,
  SlotType,
} from '@shared/types';
import { ShipId, SlotId } from '@types';

type RestrictionSignatures = {
  [K in RestrictionKey]: (expected: unknown, actual: unknown) => boolean;
};

type MeetsFunctions = RestrictionSignatures;

type ConsumerContext = {
  faction: Faction;
  shipId: ShipId;
  slotId: SlotId;
  slotType: SlotType;
};

export type HydratedSelectedUpgrades = Record<SlotId, HydratedUpgrade | null>;

export interface HydratedShipState {
  id: ShipId;
  pilot?: HydratedPilot;
  platform?: HydratedPlatform;
  upgrades: HydratedSelectedUpgrades;
}

interface HydratedListState {
  shipOrder: ShipId[];
  ships: Record<ShipId, HydratedShipState>;
}

type RestrictionArgsFunctions = {
  [K in RestrictionKey]: (
    upgrade: HydratedUpgrade,
    consumer: ConsumerContext,
    list: HydratedListState
  ) => [unknown, unknown];
};

function meetsArraySubset<T>(subset: T[], superset: T[]): boolean {
  const subsetCount = new Map<T, number>();
  const supersetCount = new Map<T, number>();

  for (const item of subset) {
    subsetCount.set(item, (subsetCount.get(item) || 0) + 1);
  }

  for (const item of superset) {
    supersetCount.set(item, (supersetCount.get(item) || 0) + 1);
  }

  for (const [item, count] of subsetCount) {
    if ((supersetCount.get(item) || 0) < count) {
      return false;
    }
  }

  return true;
}

const meetsExactMatch = <T extends number | string>(expected: T, actual: T): boolean =>
  expected === actual;

const meetsInclusion = (expected: string, actual: string[]): boolean => actual.includes(expected);

const meetsArrayInclusion = (expected: string[], actual: string): boolean =>
  expected.includes(actual);

const meetsMinimum = (expected: number, actual: number): boolean => actual >= expected;

const meetsMaximum = (expected: number, actual: number): boolean => actual <= expected;

const meetsArrayExclusion = (expected: boolean, actual: string[]): boolean =>
  !expected || actual.every((item) => !item);

const meetsAttackArc = (expected: string, actual: number): boolean => actual > 0; // Has attack in the specified arc

const meetsStandard = (
  expected: { id: number; standard: boolean },
  actual: { pilotUpgrades: number[]; standard: boolean }
): boolean => expected.standard === actual.standard && actual.pilotUpgrades.includes(expected.id);

const meetsFactionOrUnique = (
  expected: { faction: Faction; uniqueName: string },
  actual: Faction
): boolean => expected.faction === actual;

const meetsSlotEquipped = (expected: string[], actual: string[]): boolean =>
  expected.every((slot) => actual.includes(slot));

const meetsUpgradesInList = (expected: string[], actual: string[]): boolean =>
  expected.some((upgradeId) => actual.includes(upgradeId));

const meetsFunctions = {
  action: meetsInclusion,
  agility: meetsExactMatch,
  attackArc: meetsAttackArc,
  base: meetsArrayInclusion,
  chassis: meetsExactMatch,
  faction: meetsArrayInclusion,
  factionOrUnique: meetsFactionOrUnique,
  keyword: meetsInclusion,
  maxPerSquad: meetsMaximum,
  maxSkill: meetsMaximum,
  minEnergy: meetsMinimum,
  minShield: meetsMinimum,
  minSkill: meetsMinimum,
  platform: meetsArrayInclusion,
  slotEquipped: meetsSlotEquipped,
  slots: meetsArraySubset,
  solitary: meetsArrayExclusion,
  standard: meetsStandard,
  upgradesInList: meetsUpgradesInList,
} as MeetsFunctions;

const relevanceChecks: RestrictionKey[] = [
  'base',
  'chassis',
  'faction',
  'keyword',
  'platform',
  'standard',
];

const enabledChecks: RestrictionKey[] = [
  'action',
  'agility',
  'attackArc',
  'factionOrUnique',
  'maxPerSquad',
  'maxSkill',
  'minEnergy',
  'minShield',
  'minSkill',
  'slotEquipped',
  'slots',
  'solitary',
  'standardized',
  'upgradesInList',
];

/** the following restriction args functions grab, and in some cases build, arguments for the above `meetXX` funcitons */
const restrictionArgsFunctions: RestrictionArgsFunctions = {
  action: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.action,
    list.ships[consumer.shipId].platform?.actions,
  ],

  agility: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.agility,
    list.ships[consumer.shipId].platform?.agility,
  ],

  attackArc: (upgrade, consumer, list) => {
    const expectedArc = upgrade.upgradeRestrictions.attackArc;
    const platform = list.ships[consumer.shipId].platform;

    if (!platform) return [expectedArc, undefined];

    // Map arc names to platform attack values
    const arcToAttackMap: Record<string, number | undefined> = {
      'Back Arc': platform.attackb,
      'Bullseye Arc': platform.attackbull,
      'Double Turret Arc': platform.attackdt,
      'Front Arc': platform.attack,
      'Full Front Arc': platform.attackf,
      'Left Arc': platform.attackl,
      'Right Arc': platform.attackr,
      'Turret Arc': platform.attackt,
    };
    const actualAttack = expectedArc ? arcToAttackMap[expectedArc] : undefined;
    return [expectedArc, actualAttack];
  },

  base: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.base,
    list.ships[consumer.shipId].platform?.base,
  ],

  chassis: (upgrade, consumer, list) => {
    const ship = list.ships[consumer.shipId];
    return [upgrade.upgradeRestrictions.chassis, ship.pilot?.chassis || ship.platform?.chassis];
  },

  faction: (upgrade, consumer, _) => [upgrade.upgradeRestrictions.faction, consumer.faction],

  factionOrUnique: (upgrade, consumer, _) => [
    upgrade.upgradeRestrictions.factionOrUnique,
    consumer.faction,
  ],

  keyword: (upgrade, consumer, list) => {
    const ship = list.ships[consumer.shipId];
    const keywords = ([] as string[])
      .concat(ship.pilot?.keywords || [])
      .concat(ship.platform?.keyword || []);

    return [upgrade.upgradeRestrictions.keyword, keywords];
  },

  maxPerSquad: (upgrade, consumer, list) => {
    // Count existing instances of this upgrade across all ships
    let count = 0;
    for (const shipId of list.shipOrder) {
      const ship = list.ships[shipId];
      for (const slotId in ship.upgrades) {
        const equippedUpgrade = ship.upgrades[slotId];
        if (equippedUpgrade?.id === upgrade.id) {
          count++;
        }
      }
    }
    return [upgrade.upgradeRestrictions.maxPerSquad, count];
  },

  maxSkill: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.maxSkill,
    list.ships[consumer.shipId].pilot?.skill,
  ],

  minEnergy: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.minEnergy,
    list.ships[consumer.shipId].platform?.energy,
  ],

  minShield: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.minShield,
    list.ships[consumer.shipId].platform?.shields,
  ],

  minSkill: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.minSkill,
    list.ships[consumer.shipId].pilot?.skill,
  ],

  platform: (upgrade, consumer, list) => [
    upgrade.upgradeRestrictions.platform,
    list.ships[consumer.shipId].platform?.name,
  ],

  slotEquipped: (upgrade, consumer, list) => {
    const expectedSlots = upgrade.upgradeRestrictions.slotEquipped;
    const ship = list.ships[consumer.shipId];

    // Extract slot types from equipped upgrades
    const equippedSlots: string[] = [];
    for (const slotId in ship.upgrades) {
      const equippedUpgrade = ship.upgrades[slotId];
      if (equippedUpgrade) {
        // Extract slot type from slotId (e.g., "talent-0" -> "talent")
        const slotType = slotId.split('-')[0];
        equippedSlots.push(slotType);
      }
    }

    return [expectedSlots, equippedSlots];
  },

  slots: (upgrade, consumer, list) => {
    const expected = upgrade.upgradeRestrictions.slots;
    if (!expected || expected.length < 2) {
      return [undefined, undefined];
    }

    const ship = list.ships[consumer.shipId];
    // TODO: Handle when equipped upgrades change a pilot's slots
    const actual = ship.pilot?.slots;

    return [expected, actual];
  },

  solitary: (upgrade, consumer, list) => {
    const isSolitary = upgrade.upgradeRestrictions.solitary;
    const ship = list.ships[consumer.shipId];

    // Get other upgrades in the same slot type
    const otherUpgradesInSlot: string[] = [];
    for (const slotId in ship.upgrades) {
      if (slotId !== consumer.slotId && slotId.startsWith(consumer.slotType)) {
        const equippedUpgrade = ship.upgrades[slotId];
        if (equippedUpgrade) {
          otherUpgradesInSlot.push(equippedUpgrade.id.toString());
        }
      }
    }

    return [isSolitary, otherUpgradesInSlot];
  },

  standard: (upgrade, consumer, list) => {
    if (!upgrade.upgradeRestrictions.standard) {
      return [undefined, undefined];
    }

    const pilot = list.ships[consumer.shipId].pilot;
    return [
      { id: upgrade.id, standard: upgrade.upgradeRestrictions.standard },
      {
        pilotUpgrades: pilot?.upgrades || [],
        standard: pilot?.standard || false,
      },
    ];
  },

  standardized: (upgrade, consumer, list) => {
    return [undefined, undefined];
  },

  upgradesInList: (upgrade, consumer, list) => {
    const requiredUpgrades = upgrade.upgradeRestrictions.upgradesInList;
    const ship = list.ships[consumer.shipId];

    // Get list of equipped upgrade IDs
    const equippedUpgrades: string[] = [];
    for (const slotId in ship.upgrades) {
      const equippedUpgrade = ship.upgrades[slotId];
      if (equippedUpgrade) {
        equippedUpgrades.push(equippedUpgrade.id.toString());
      }
    }

    return [requiredUpgrades, equippedUpgrades];
  },
};

function validateRestriction(
  restrictionType: RestrictionKey,
  upgrade: HydratedUpgrade,
  consumer: ConsumerContext,
  list: HydratedListState
): boolean {
  const [expected, actual] = restrictionArgsFunctions[restrictionType](upgrade, consumer, list);

  if (expected === undefined) return true;
  if (actual === undefined) return false;

  return meetsFunctions[restrictionType](expected, actual);
}

function makeValidationGroup(checks: RestrictionKey[]) {
  return function validateGroup(
    upgrade: HydratedUpgrade,
    consumer: ConsumerContext,
    list: HydratedListState
  ) {
    return checks.every((checkType) => validateRestriction(checkType, upgrade, consumer, list));
  };
}

export const upgradeIsRelevant = makeValidationGroup(relevanceChecks);

export const upgradeIsEnabled = makeValidationGroup(enabledChecks);
