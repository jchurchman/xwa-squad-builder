import { useCallback, useMemo } from 'react';

import { selectPilotsByPlatformAndFaction, selectShipPilot } from '@selectors';
import { choosePilotId } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const pilots = useAppSelector((state) =>
    selectPilotsByPlatformAndFaction(state, { faction, shipId })
  );
  const selected = useAppSelector((state) => selectShipPilot(state, { shipId }));

  const options = useMemo(() => {
    return pilots.map((pilot) => ({ label: pilot.name, value: pilot.id }));
  }, [pilots]);

  const onSelect = useCallback(
    (pilotId?: number) => {
      dispatch(choosePilotId({ pilotId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
