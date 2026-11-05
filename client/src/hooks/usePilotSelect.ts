import { useCallback, useMemo } from 'react';

import { selectShipById } from '@selectors';
import { choosePilot } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useFactionShips } from './useFactionShips';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const { ships } = useFactionShips();
  const ship = useAppSelector((state) => selectShipById(state, shipId));

  // The backend already sorts pilots by initiative, then name.
  const options = useMemo(() => {
    const platform = ships.find((s) => s.xws === ship?.platformXws);
    return (platform?.pilots ?? []).map((pilot) => ({ label: pilot.name, value: pilot.xws }));
  }, [ships, ship?.platformXws]);

  const onSelect = useCallback(
    (pilotXws?: string) => {
      dispatch(choosePilot({ pilotXws, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected: ship?.pilotXws };
}
