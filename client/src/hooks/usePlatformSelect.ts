import { useCallback, useMemo } from 'react';

import type { Ship } from '@/gen/xwa/cards/v1/cards_pb';
import { isPilotLegal } from '@/rules/pointsRules';
import { selectShipById } from '@/state/selectors/list';
import { choosePlatform } from '@/state/slices/listSlice';
import { withDisallowedChoice } from '@/utils/withDisallowedChoice';

import { useAppDispatch, useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';
import { usePointsVersion } from './usePointsVersion';
import { useTypedParams } from './useTypedParams';

export function usePlatformSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const { isLoading, ships } = useFactionShips();
  const { points } = usePointsVersion();
  const { format } = useTypedParams();
  const selected = useAppSelector((state) => selectShipById(state, shipId)?.platformXws);

  // Ships with no pilot legal in the format are left out.
  const options = useMemo(() => {
    const toOption = (ship: Ship) => ({ label: ship.name, value: ship.xws });
    const legal = ships
      .filter((ship) => ship.pilots.some((pilot) => isPilotLegal(points, pilot.xws, format)))
      .map(toOption);
    const current = ships.find((ship) => ship.xws === selected);
    return withDisallowedChoice(legal, current && toOption(current));
  }, [format, points, selected, ships]);

  const onSelect = useCallback(
    (platformXws?: string) => {
      dispatch(choosePlatform({ platformXws, shipId }));
    },
    [dispatch, shipId]
  );

  return { isLoading, onClear: onSelect, onSelect, options, selected };
}
