import { useMemo } from 'react';

import { getListPoints } from '@/rules/pointsRules';

import { useSquad } from './useSquad';

/** The list's pilot points and the most the points version allows. */
export function useListPoints() {
  const { points, squad } = useSquad();
  const total = useMemo(() => getListPoints(squad, points), [squad, points]);

  return { max: points.maxListPoints, total };
}
