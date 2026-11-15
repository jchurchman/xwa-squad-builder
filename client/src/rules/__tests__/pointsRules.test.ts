import { create } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

import { PilotSchema, ShipSchema, UpgradeSchema } from '@/gen/xwa/cards/v1/cards_pb';
import {
  PilotCostSchema,
  PointsVersionSchema,
  UpgradeCostSchema,
} from '@/gen/xwa/points/v1/points_pb';
import {
  getListPoints,
  getLoadoutPoints,
  getUpgradeCost,
  indexPointsVersion,
  isPilotLegal,
  isUpgradeLegal,
} from '@/rules/pointsRules';
import type { SquadShip } from '@/rules/upgradeRules';

const REBELS = 'rebelalliance';
const SCUM = 'scumandvillainy';

const points = indexPointsVersion(
  create(PointsVersionSchema, {
    maxListPoints: 20,
    pilotCosts: [
      create(PilotCostSchema, { cost: 6, formats: ['standard'], pilotXws: 'lukeskywalker' }),
      create(PilotCostSchema, { cost: 4, pilotXws: 'wedgeantilles' }),
    ],
    upgradeCosts: [
      create(UpgradeCostSchema, { cost: 3, formats: ['standard'], upgradeXws: 'hansolo' }),
      create(UpgradeCostSchema, {
        cost: 5,
        factionXws: SCUM,
        formats: ['epic'],
        upgradeXws: 'hansolo',
      }),
      create(UpgradeCostSchema, { upgradeXws: 'tube' }),
    ],
  })
);

describe('getUpgradeCost', () => {
  it('uses the row for every faction unless the faction has its own', () => {
    expect(getUpgradeCost(points, 'hansolo', REBELS)).toBe(3);
    expect(getUpgradeCost(points, 'hansolo', SCUM)).toBe(5);
  });

  it('is undefined for upgrades without a cost', () => {
    expect(getUpgradeCost(points, 'tube', REBELS)).toBeUndefined();
    expect(getUpgradeCost(points, 'nosuchupgrade', REBELS)).toBeUndefined();
  });
});

describe('getListPoints', () => {
  it('adds up pilot costs only', () => {
    const squadShip = (xws: string): SquadShip => ({
      id: xws,
      pilot: create(PilotSchema, { xws }),
      ship: create(ShipSchema),
      slots: [],
      upgrades: {},
    });
    expect(getListPoints([squadShip('lukeskywalker'), squadShip('wedgeantilles')], points)).toBe(
      10
    );
  });
});

describe('indexPointsVersion', () => {
  it('prices nothing without a version', () => {
    const empty = indexPointsVersion(undefined);
    expect(empty.maxListPoints).toBe(0);
    expect(getUpgradeCost(empty, 'hansolo', REBELS)).toBeUndefined();
  });
});

describe('isUpgradeLegal', () => {
  it('needs a cost and the format, from the faction row when there is one', () => {
    expect(isUpgradeLegal(points, 'hansolo', REBELS, 'standard')).toBe(true);
    expect(isUpgradeLegal(points, 'hansolo', SCUM, 'standard')).toBe(false);
    expect(isUpgradeLegal(points, 'hansolo', SCUM, 'epic')).toBe(true);
    expect(isUpgradeLegal(points, 'tube', REBELS, 'standard')).toBe(false);
  });
});

describe('isPilotLegal', () => {
  it('needs the format', () => {
    expect(isPilotLegal(points, 'lukeskywalker', 'standard')).toBe(true);
    expect(isPilotLegal(points, 'lukeskywalker', 'epic')).toBe(false);
    expect(isPilotLegal(points, 'nosuchpilot', 'standard')).toBe(false);
  });
});

describe('getLoadoutPoints', () => {
  it("adds up the ship's upgrade costs for the faction", () => {
    const squadShip: SquadShip = {
      id: 'a',
      pilot: create(PilotSchema, { xws: 'lukeskywalker' }),
      ship: create(ShipSchema),
      slots: [],
      upgrades: {
        'crew-0': create(UpgradeSchema, { xws: 'hansolo' }),
        'crew-1': create(UpgradeSchema, { xws: 'tube' }),
      },
    };
    expect(getLoadoutPoints(squadShip, points, REBELS)).toBe(3);
    expect(getLoadoutPoints(squadShip, points, SCUM)).toBe(5);
  });
});
