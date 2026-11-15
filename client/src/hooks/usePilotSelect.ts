import { useCallback, useMemo } from 'react';

import { selectShipById } from '@/state/selectors/list';
import { choosePilot } from '@/state/slices/listSlice';
import { withPoints } from '@/strings/points';

import { useAppDispatch, useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';
import { usePointsVersion } from './usePointsVersion';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const { ships } = useFactionShips();
  const { points } = usePointsVersion();
  const ship = useAppSelector((state) => selectShipById(state, shipId));

  // The backend already sorts pilots by initiative, then name.
  const options = useMemo(() => {
    const platform = ships.find((s) => s.xws === ship?.platformXws);
    return (platform?.pilots ?? []).map((pilot) => ({
      label: withPoints(pilot.name, points.pilots.get(pilot.xws)?.cost),
      value: pilot.xws,
    }));
  }, [points, ships, ship?.platformXws]);

  const onSelect = useCallback(
    (pilotXws?: string) => {
      dispatch(choosePilot({ pilotXws, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected: ship?.pilotXws };
}
