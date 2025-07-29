import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectPilotsByPlatform, selectShipPilot } from '@selectors';
import { selectPilotId } from 'src/state/slices/listSlice';

import { useAppDispatch } from './state';

import type { RootState } from '@types';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const dispatch = useAppDispatch();

  const options = useSelector((state: RootState) => selectPilotsByPlatform(state, shipId));
  const selected = useSelector((state: RootState) => selectShipPilot(state, shipId));

  const onSelect = useCallback(
    (pilotId?: number) => {
      dispatch(selectPilotId({ pilotId, shipId }));
    },
    [dispatch, shipId]
  );

  return { onClear: onSelect, onSelect, options, selected };
}
