import { useMemo } from 'react';

import { POINTS_SOURCE } from '@/constants';
import { indexPointsVersion } from '@/rules/pointsRules';
import { useGetPointsVersionQuery } from '@/state/slices/apiSlice';

/** The points source's newest published points version. Every caller shares one cached query. */
export function usePointsVersion() {
  const { data, isError, isLoading } = useGetPointsVersionQuery(POINTS_SOURCE);
  const points = useMemo(() => indexPointsVersion(data), [data]);

  return { isError, isLoading, points };
}
