import { useMemo } from 'react';

import { getLoadout, getLoadoutPoints } from '@/rules/pointsRules';

import { useSquad } from './useSquad';

/**
 * A ship's upgrade points and its pilot's loadout value. Undefined without a pilot, and for
 * standard loadout pilots, whose upgrades are fixed.
 */
export function useShipLoadout({ shipId }: { shipId: string }) {
  const { factionXws, points, squad } = useSquad();
  const squadShip = squad.find((s) => s.id === shipId);

  return useMemo(() => {
    if (!squadShip || squadShip.pilot.standardLoadout.length > 0) {
      return undefined;
    }
    return {
      max: getLoadout(points, squadShip.pilot.xws),
      used: getLoadoutPoints(squadShip, points, factionXws),
    };
  }, [factionXws, points, squadShip]);
}
