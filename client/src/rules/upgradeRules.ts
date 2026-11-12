import { SLOT_ORDER } from '@/constants';
import type { Action, Pilot, RestrictionGroup, Ship, Upgrade } from '@/gen/xwa/cards/v1/cards_pb';

const SLOT_ID_SEPARATOR = '-';

// e.g. "force-power-0", "crew-1"
export type SlotId = string;

export interface ShipSlot {
  id: SlotId;
  type: string;
}

/** One ship in the squad, resolved to its cards. */
export interface SquadShip {
  id: string;
  pilot: Pilot;
  ship: Ship;
  /** Equipped upgrades by slot. Standard loadout upgrades are keyed by their own IDs. */
  upgrades: Record<SlotId, Upgrade>;
}

/** Where an upgrade is being chosen: which faction, squad, ship, and slot. */
export interface SlotContext {
  factionXws: string;
  shipId: string;
  slotId: SlotId;
  squad: SquadShip[];
}

function getSlotOrderIndex(slotType: string): number {
  const index = SLOT_ORDER.indexOf(slotType);
  return index === -1 ? SLOT_ORDER.length : index;
}

function slotTypeToSlotIdPrefix(slotType: string): string {
  return slotType.toLowerCase().replace(/\s+/g, SLOT_ID_SEPARATOR);
}

/** A pilot's upgrade slots in display order, each with a stable ID. */
export function getShipSlots(pilot: Pilot): ShipSlot[] {
  const counts: Record<string, number> = {};
  return [...pilot.slots]
    .sort((a, b) => getSlotOrderIndex(a) - getSlotOrderIndex(b))
    .map((type) => {
      const index = counts[type] ?? 0;
      counts[type] = index + 1;
      return { id: `${slotTypeToSlotIdPrefix(type)}${SLOT_ID_SEPARATOR}${index}`, type };
    });
}

/**
 * Some upgrades occupy more than one slot. The slot an upgrade is chosen in is its primary slot;
 * each extra slot it needs is filled by the first free slot of that type. Returns which primary
 * slot claims each extra slot.
 */
export function getClaimedSlots(
  slots: ShipSlot[],
  upgrades: Record<SlotId, Upgrade>
): Record<SlotId, SlotId> {
  const claimed: Record<SlotId, SlotId> = {};
  const isFree = (slot: ShipSlot) => !upgrades[slot.id] && !claimed[slot.id];

  for (const primary of slots) {
    const upgrade = upgrades[primary.id];
    if (!upgrade) {
      continue;
    }
    for (const extraType of upgrade.slots.slice(1)) {
      const free = slots.find((slot) => slot.type === extraType && isFree(slot));
      if (free) {
        claimed[free.id] = primary.id;
      }
    }
  }
  return claimed;
}

function getPrimarySlotType(upgrade: Upgrade): string {
  return upgrade.slots[0];
}

/** The squad as it would be if the slot being chosen were empty. */
function getSquadWithoutSlot(context: SlotContext): SquadShip[] {
  return context.squad.map((squadShip) => {
    if (squadShip.id !== context.shipId) {
      return squadShip;
    }
    const upgrades = { ...squadShip.upgrades };
    delete upgrades[context.slotId];
    return { ...squadShip, upgrades };
  });
}

function getCardNames(squad: SquadShip[]): string[] {
  return squad.flatMap((squadShip) => [
    squadShip.pilot.name,
    ...Object.values(squadShip.upgrades).map((upgrade) => upgrade.name),
  ]);
}

function hasAction(actions: Action[], required: Action): boolean {
  return actions.some(
    (action) =>
      action.type === required.type &&
      (!required.difficulty || action.difficulty === required.difficulty)
  );
}

function includesAny(values: string[], wanted: string[]): boolean {
  return wanted.some((value) => values.includes(value));
}

/** What a restriction condition is checked against. */
interface RestrictionCheckArgs {
  context: SlotContext;
  group: RestrictionGroup;
  squad: SquadShip[];
  thisShip: SquadShip;
  upgrade: Upgrade;
}

interface RestrictionCondition {
  /** Whether the group sets this condition. */
  appliesTo: (group: RestrictionGroup) => boolean;
  isMet: (args: RestrictionCheckArgs) => boolean;
}

function getShipActions({ pilot, ship }: SquadShip): Action[] {
  return pilot.shipActions.length > 0 ? pilot.shipActions : ship.actions;
}

/** Solitary: no other ship may have an upgrade of the same type. */
function isOnlyUpgradeOfItsType({ context, squad, upgrade }: RestrictionCheckArgs): boolean {
  const slotType = getPrimarySlotType(upgrade);
  return squad
    .filter((squadShip) => squadShip.id !== context.shipId)
    .every((other) =>
      Object.values(other.upgrades).every((equipped) => getPrimarySlotType(equipped) !== slotType)
    );
}

/**
 * Every condition a restriction group can set. Conditions that are recorded but not enforced yet
 * (standardized, non-limited) are left out, so a group made only of those always passes.
 */
const RESTRICTION_CONDITIONS: RestrictionCondition[] = [
  {
    appliesTo: (group) => group.factions.length > 0,
    isMet: ({ context, group }) => group.factions.includes(context.factionXws),
  },
  {
    appliesTo: (group) => group.ships.length > 0,
    isMet: ({ group, thisShip }) => group.ships.includes(thisShip.ship.xws),
  },
  {
    appliesTo: (group) => group.sizes.length > 0,
    isMet: ({ group, thisShip }) => group.sizes.includes(thisShip.ship.size),
  },
  {
    appliesTo: (group) => group.actions.length > 0,
    isMet: ({ group, thisShip }) =>
      group.actions.some((required) => hasAction(getShipActions(thisShip), required)),
  },
  {
    appliesTo: (group) => group.keywords.length > 0,
    isMet: ({ group, thisShip }) => includesAny(thisShip.pilot.keywords, group.keywords),
  },
  {
    appliesTo: (group) => group.shipAbilities.length > 0,
    isMet: ({ group, thisShip }) => group.shipAbilities.includes(thisShip.pilot.shipAbility),
  },
  {
    appliesTo: (group) => group.names.length > 0,
    isMet: ({ group, squad }) => includesAny(getCardNames(squad), group.names),
  },
  {
    appliesTo: (group) => group.equipped.length > 0,
    isMet: ({ group, thisShip }) =>
      includesAny(Object.values(thisShip.upgrades).map(getPrimarySlotType), group.equipped),
  },
  {
    appliesTo: (group) => group.arcs.length > 0,
    isMet: ({ group, thisShip }) => includesAny(thisShip.ship.arcs, group.arcs),
  },
  {
    appliesTo: (group) => group.forceSides.length > 0,
    isMet: ({ group, thisShip }) => includesAny(thisShip.pilot.forceSides, group.forceSides),
  },
  {
    appliesTo: (group) => group.solitary,
    isMet: isOnlyUpgradeOfItsType,
  },
];

/** A group is met when any one of the conditions it sets is met, or when it sets none. */
function meetsRestrictionGroup(
  group: RestrictionGroup,
  thisShip: SquadShip,
  squad: SquadShip[],
  context: SlotContext,
  upgrade: Upgrade
): boolean {
  const args = { context, group, squad, thisShip, upgrade };
  const setConditions = RESTRICTION_CONDITIONS.filter((condition) => condition.appliesTo(group));
  return setConditions.length === 0 || setConditions.some((condition) => condition.isMet(args));
}

function isWithinNameLimit(upgrade: Upgrade, squad: SquadShip[]): boolean {
  if (upgrade.limited === 0) {
    return true;
  }
  const copies = getCardNames(squad).filter((name) => name === upgrade.name).length;
  return copies < upgrade.limited;
}

function hasRoomForExtraSlots(upgrade: Upgrade, thisShip: SquadShip, slotId: SlotId): boolean {
  const extraTypes = upgrade.slots.slice(1);
  if (extraTypes.length === 0) {
    return true;
  }

  const slots = getShipSlots(thisShip.pilot);
  const claimed = getClaimedSlots(slots, thisShip.upgrades);
  const freeSlots = slots.filter(
    (slot) => slot.id !== slotId && !thisShip.upgrades[slot.id] && !claimed[slot.id]
  );

  return extraTypes.every((type, index) => {
    const needed = extraTypes.slice(0, index + 1).filter((t) => t === type).length;
    return freeSlots.filter((slot) => slot.type === type).length >= needed;
  });
}

/** Whether the upgrade can go in the slot, given the rest of the squad. */
export function canEquipUpgrade(upgrade: Upgrade, context: SlotContext): boolean {
  const squad = getSquadWithoutSlot(context);
  const thisShip = squad.find((squadShip) => squadShip.id === context.shipId);
  if (!thisShip) {
    return false;
  }

  return (
    upgrade.restrictions.every((group) =>
      meetsRestrictionGroup(group, thisShip, squad, context, upgrade)
    ) &&
    isWithinNameLimit(upgrade, squad) &&
    hasRoomForExtraSlots(upgrade, thisShip, context.slotId)
  );
}

/** Upgrades a player can choose for a slot, sorted by name. */
export function getUpgradeOptions(
  upgrades: Upgrade[],
  slotType: string,
  context: SlotContext
): Upgrade[] {
  return upgrades
    .filter(
      (upgrade) =>
        !upgrade.standardLoadoutOnly &&
        getPrimarySlotType(upgrade) === slotType &&
        canEquipUpgrade(upgrade, context)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
