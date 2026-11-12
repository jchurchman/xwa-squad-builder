import { create } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

import {
  ActionSchema,
  PilotSchema,
  RestrictionGroupSchema,
  ShipSchema,
  UpgradeSchema,
} from 'src/gen/xwa/cards/v1/cards_pb';

import {
  canEquipUpgrade,
  getClaimedSlots,
  getShipSlots,
  getUpgradeOptions,
  type SlotContext,
  type SquadShip,
} from '../upgradeRules';

import type { MessageInitShape } from '@bufbuild/protobuf';

const REBELS = 'rebelalliance';
const SCUM = 'scumandvillainy';

const xwing = create(ShipSchema, {
  actions: [create(ActionSchema, { difficulty: 'White', type: 'Focus' })],
  arcs: ['Front Arc'],
  name: 'T-65 X-wing',
  size: 'Small',
  xws: 't65xwing',
});

const yt1300 = create(ShipSchema, {
  actions: [create(ActionSchema, { difficulty: 'White', type: 'Rotate Arc' })],
  arcs: ['Double Turret Arc'],
  name: 'Modified YT-1300 Light Freighter',
  size: 'Large',
  xws: 'modifiedyt1300lightfreighter',
});

const luke = create(PilotSchema, {
  forceSides: ['light'],
  keywords: ['X-wing'],
  limited: 1,
  name: 'Luke Skywalker',
  slots: ['Astromech', 'Force Power', 'Talent', 'Torpedo'],
  xws: 'lukeskywalker',
});

const han = create(PilotSchema, {
  limited: 1,
  name: 'Han Solo',
  slots: ['Crew', 'Crew', 'Gunner', 'Cannon', 'Cannon'],
  xws: 'hansolo-modifiedyt1300lightfreighter',
});

function makeUpgrade(
  init: MessageInitShape<typeof UpgradeSchema>,
  restrictions: MessageInitShape<typeof RestrictionGroupSchema>[] = []
) {
  return create(UpgradeSchema, {
    ...init,
    restrictions: restrictions.map((group) => create(RestrictionGroupSchema, group)),
  });
}

const r2d2 = makeUpgrade({ limited: 1, name: 'R2-D2', slots: ['Astromech'], xws: 'r2d2' }, [
  { factions: [REBELS] },
]);
const chewbaccaCrew = makeUpgrade({
  limited: 1,
  name: 'Chewbacca',
  slots: ['Crew'],
  xws: 'chewbacca',
});
const hanCrew = makeUpgrade({ limited: 1, name: 'Han Solo', slots: ['Crew'], xws: 'hansolo' });
const ooo = makeUpgrade({ limited: 1, name: '0-0-0', slots: ['Crew'], xws: '000' }, [
  { factions: [SCUM], names: ['Darth Vader'] },
]);
const protonCannons = makeUpgrade({
  name: 'Proton Cannons',
  slots: ['Cannon', 'Cannon'],
  xws: 'protoncannons',
});
const l4er5 = makeUpgrade({ limited: 1, name: 'L4-ER5', slots: ['Astromech'], xws: 'l4er5' }, [
  { actions: [create(ActionSchema, { type: 'Rotate Arc' })] },
]);
const hate = makeUpgrade({ name: 'Hate', slots: ['Force Power'], xws: 'hate' }, [
  { forceSides: ['dark'] },
]);
const sparePartsCanisters = makeUpgrade(
  { name: 'Spare Parts Canisters', slots: ['Modification'], xws: 'sparepartscanisters' },
  [{ equipped: ['Astromech'] }]
);
const solitaryCrew = makeUpgrade({ name: 'Kraken', slots: ['Crew'], xws: 'kraken' }, [
  { solitary: true },
]);
const standardizedOnly = makeUpgrade({ name: 'Sensitive Controls', slots: ['Crew'], xws: 'sc' }, [
  { standardized: true },
]);

function makeSquadShip(id: string, ship: typeof xwing, pilot: typeof luke, upgrades = {}) {
  return { id, pilot, ship, upgrades } satisfies SquadShip;
}

function makeContext(squad: SquadShip[], overrides: Partial<SlotContext> = {}): SlotContext {
  return { factionXws: REBELS, shipId: squad[0].id, slotId: 'crew-0', squad, ...overrides };
}

describe('getShipSlots', () => {
  it('orders slots by type and numbers repeats', () => {
    expect(getShipSlots(han)).toEqual([
      { id: 'cannon-0', type: 'Cannon' },
      { id: 'cannon-1', type: 'Cannon' },
      { id: 'crew-0', type: 'Crew' },
      { id: 'crew-1', type: 'Crew' },
      { id: 'gunner-0', type: 'Gunner' },
    ]);
  });

  it('uses dashes for multi-word slot types', () => {
    expect(getShipSlots(luke).map((slot) => slot.id)).toEqual([
      'talent-0',
      'force-power-0',
      'torpedo-0',
      'astromech-0',
    ]);
  });
});

describe('getClaimedSlots', () => {
  it('gives an upgrade its extra slots from the first free slot of each type', () => {
    const slots = getShipSlots(han);
    expect(getClaimedSlots(slots, { 'cannon-0': protonCannons })).toEqual({
      'cannon-1': 'cannon-0',
    });
  });
});

describe('canEquipUpgrade', () => {
  it('checks faction restrictions', () => {
    const squad = [makeSquadShip('a', xwing, luke)];
    const context = makeContext(squad, { slotId: 'astromech-0' });
    expect(canEquipUpgrade(r2d2, context)).toBe(true);
    expect(canEquipUpgrade(r2d2, { ...context, factionXws: SCUM })).toBe(false);
  });

  it('passes a group when any one of its conditions is met', () => {
    const squad = [makeSquadShip('a', yt1300, han)];
    expect(canEquipUpgrade(ooo, makeContext(squad))).toBe(false);
    expect(canEquipUpgrade(ooo, makeContext(squad, { factionXws: SCUM }))).toBe(true);

    const withVader = [
      ...squad,
      makeSquadShip('b', xwing, create(PilotSchema, { name: 'Darth Vader', xws: 'darthvader' })),
    ];
    expect(canEquipUpgrade(ooo, makeContext(withVader))).toBe(true);
  });

  it('checks the ship has a required action', () => {
    expect(
      canEquipUpgrade(l4er5, makeContext([makeSquadShip('a', yt1300, han)], { slotId: 'x' }))
    ).toBe(true);
    expect(
      canEquipUpgrade(l4er5, makeContext([makeSquadShip('a', xwing, luke)], { slotId: 'x' }))
    ).toBe(false);
  });

  it('checks Force side', () => {
    const context = makeContext([makeSquadShip('a', xwing, luke)], { slotId: 'force-power-0' });
    expect(canEquipUpgrade(hate, context)).toBe(false);
  });

  it('requires another slot type to be filled for "equipped" restrictions', () => {
    const bare = makeContext([makeSquadShip('a', xwing, luke)], { slotId: 'modification-0' });
    expect(canEquipUpgrade(sparePartsCanisters, bare)).toBe(false);

    const withAstromech = makeContext([makeSquadShip('a', xwing, luke, { 'astromech-0': r2d2 })], {
      slotId: 'modification-0',
    });
    expect(canEquipUpgrade(sparePartsCanisters, withAstromech)).toBe(true);
  });

  it('enforces name limits across pilots and upgrades', () => {
    const squad = [makeSquadShip('a', yt1300, han)];
    // The Han Solo pilot is already in the squad, so the Han Solo crew card is not allowed.
    expect(canEquipUpgrade(hanCrew, makeContext(squad))).toBe(false);
    expect(canEquipUpgrade(chewbaccaCrew, makeContext(squad))).toBe(true);
  });

  it('ignores the upgrade being replaced when counting copies', () => {
    const squad = [makeSquadShip('a', yt1300, han, { 'crew-0': chewbaccaCrew })];
    expect(canEquipUpgrade(chewbaccaCrew, makeContext(squad, { slotId: 'crew-0' }))).toBe(true);
    expect(canEquipUpgrade(chewbaccaCrew, makeContext(squad, { slotId: 'crew-1' }))).toBe(false);
  });

  it('needs free slots for every slot an upgrade occupies', () => {
    const empty = makeContext([makeSquadShip('a', yt1300, han)], { slotId: 'cannon-0' });
    expect(canEquipUpgrade(protonCannons, empty)).toBe(true);

    const otherCannonUsed = makeContext(
      [makeSquadShip('a', yt1300, han, { 'cannon-1': protonCannons })],
      { slotId: 'cannon-0' }
    );
    expect(canEquipUpgrade(protonCannons, otherCannonUsed)).toBe(false);
  });

  it('allows only one ship to use an upgrade type when the upgrade is solitary', () => {
    const squad = [
      makeSquadShip('a', yt1300, han),
      makeSquadShip('b', yt1300, han, { 'crew-0': chewbaccaCrew }),
    ];
    expect(canEquipUpgrade(solitaryCrew, makeContext(squad))).toBe(false);
    expect(canEquipUpgrade(solitaryCrew, makeContext([squad[0]]))).toBe(true);
  });

  it('does not block on restrictions that are not enforced yet', () => {
    expect(canEquipUpgrade(standardizedOnly, makeContext([makeSquadShip('a', yt1300, han)]))).toBe(
      true
    );
  });

  describe('checks ship and pilot conditions', () => {
    type GroupInit = MessageInitShape<typeof RestrictionGroupSchema>;

    const pilot = create(PilotSchema, {
      keywords: ['Freighter'],
      name: 'Test Pilot',
      shipAbility: 'Co-Pilot',
      slots: ['Crew'],
      xws: 'testpilot',
    });
    const context = makeContext([makeSquadShip('a', yt1300, pilot)]);
    const makeRestrictedCrew = (group: GroupInit) =>
      makeUpgrade({ name: 'Test Crew', slots: ['Crew'], xws: 'testcrew' }, [group]);

    it.each<[string, GroupInit, GroupInit]>([
      ['ships', { ships: [yt1300.xws] }, { ships: [xwing.xws] }],
      ['sizes', { sizes: ['Large'] }, { sizes: ['Small'] }],
      ['keywords', { keywords: ['Freighter'] }, { keywords: ['X-wing'] }],
      ['ship abilities', { shipAbilities: ['Co-Pilot'] }, { shipAbilities: ['Autothrusters'] }],
      ['arcs', { arcs: ['Double Turret Arc'] }, { arcs: ['Front Arc'] }],
    ])('%s', (_, met, unmet) => {
      expect(canEquipUpgrade(makeRestrictedCrew(met), context)).toBe(true);
      expect(canEquipUpgrade(makeRestrictedCrew(unmet), context)).toBe(false);
    });
  });
});

describe('getUpgradeOptions', () => {
  it('lists legal upgrades for the slot type, sorted by name, without standard-loadout-only cards', () => {
    const loadoutOnly = makeUpgrade({
      name: 'Admiral Ozzel',
      slots: ['Crew'],
      standardLoadoutOnly: true,
      xws: 'admiralozzel',
    });
    const options = getUpgradeOptions(
      [hanCrew, chewbaccaCrew, r2d2, loadoutOnly, ooo],
      'Crew',
      makeContext([makeSquadShip('a', yt1300, han)])
    );
    expect(options.map((upgrade) => upgrade.name)).toEqual(['Chewbacca']);
  });
});
