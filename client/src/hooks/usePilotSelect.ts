import { useCallback, useMemo } from 'react';

import { selectShipById } from '@selectors';
import { FACTION_XWS } from 'src/constants';
import { useListShipsQuery } from 'src/state/slices/apiSlice';
import { choosePilot } from 'src/state/slices/listSlice';

import { useAppDispatch, useAppSelector } from './state';
import { useTypedParams } from './useTypedParams';

export function usePilotSelect({ shipId }: { shipId: string }) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();

  // Same query as usePlatformSelect; RTK Query serves it from the cache.
  const { data: ships } = useListShipsQuery(FACTION_XWS[faction]);
  const ship = useAppSelector((state) => selectShipById(state, shipId));

  // The backend already sorts pilots by initiative, then name.
  const options = useMemo(() => {
    const platform = ships?.find((s) => s.xws === ship?.platformXws);
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
