import { create } from '@bufbuild/protobuf';
import { describe, expect, it } from 'vitest';

import { PilotSchema, ShipSchema } from '@/gen/xwa/cards/v1/cards_pb';
import {
  PilotCostSchema,
  PointsVersionSchema,
  UpgradeCostSchema,
} from '@/gen/xwa/points/v1/points_pb';
import { getListPoints, getUpgradeCost, indexPointsVersion } from '@/rules/pointsRules';
import type { SquadShip } from '@/rules/upgradeRules';

const REBELS = 'rebelalliance';
const SCUM = 'scumandvillainy';

const points = indexPointsVersion(
  create(PointsVersionSchema, {
    maxListPoints: 20,
    pilotCosts: [
      create(PilotCostSchema, { cost: 6, pilotXws: 'lukeskywalker' }),
      create(PilotCostSchema, { cost: 4, pilotXws: 'wedgeantilles' }),
    ],
    upgradeCosts: [
      create(UpgradeCostSchema, { cost: 3, upgradeXws: 'hansolo' }),
      create(UpgradeCostSchema, { cost: 5, factionXws: SCUM, upgradeXws: 'hansolo' }),
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
