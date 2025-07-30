import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectPilotsByPlatformAndFaction, selectShipPilot } from '@selectors';
import { selectPilotId } from 'src/state/slices/listSlice';

import { useAppDispatch } from './state';
import { useTypedParams } from './useTypedParams';

import type { RootState } from '@types';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  const pilots = useSelector((state: RootState) =>
    selectPilotsByPlatformAndFaction(state, { faction, shipId })
  );
  const selected = useSelector((state: RootState) => selectShipPilot(state, { shipId }));

  const options = useMemo(() => {
    return pilots.map((pilot) => ({ label: pilot.name, value: pilot.id }));
  }, [pilots]);

  const onSelect = useCallback(
    (pilotId?: number) => {
      dispatch(selectPilotId({ pilotId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
