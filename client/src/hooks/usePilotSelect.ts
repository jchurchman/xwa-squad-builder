import { useCallback, useMemo } from 'react';

import { isPilotLegal } from '@/rules/pointsRules';
import { selectShipById } from '@/state/selectors/list';
import { choosePilot } from '@/state/slices/listSlice';
import { withPoints } from '@/strings/points';
import { withDisallowedChoice } from '@/utils/withDisallowedChoice';

import { useAppDispatch, useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';
import { usePointsVersion } from './usePointsVersion';
import { useTypedParams } from './useTypedParams';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const { ships } = useFactionShips();
  const { points } = usePointsVersion();
  const { format } = useTypedParams();
  const ship = useAppSelector((state) => selectShipById(state, shipId));

  // The backend already sorts pilots by initiative, then name.
  const options = useMemo(() => {
    const pilots = ships.find((s) => s.xws === ship?.platformXws)?.pilots ?? [];
    const legal = pilots
      .filter((pilot) => isPilotLegal(points, pilot.xws, format))
      .map((pilot) => ({
        label: withPoints(pilot.name, points.pilots.get(pilot.xws)?.cost),
        value: pilot.xws,
      }));
    const current = pilots.find((pilot) => pilot.xws === ship?.pilotXws);
    return withDisallowedChoice(legal, current && { label: current.name, value: current.xws });
  }, [format, points, ships, ship?.pilotXws, ship?.platformXws]);

  const onSelect = useCallback(
    (pilotXws?: string) => {
      dispatch(choosePilot({ pilotXws, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected: ship?.pilotXws };
}
