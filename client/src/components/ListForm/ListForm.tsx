import { Button } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useAppDispatch, useTypedParams } from 'src/hooks';
import { selectShipOrderIds } from 'src/state/selectors/list';
import { useFetchPlatformsByFactionQuery } from 'src/state/slices/apiSlice';
import { addShip, newList } from 'src/state/slices/listSlice';
import { Faction } from 'src/types';

import { ShipForm } from './ShipForm';

export function ListForm() {
  const { faction } = useTypedParams();
  const shipIds = useSelector(selectShipOrderIds);
  const dispatch = useAppDispatch();

  const { isLoading } = useFetchPlatformsByFactionQuery(faction);

  useEffect(() => {
    if (!isLoading && shipIds.length === 0) {
      dispatch(newList(faction));
    }
  }, [isLoading, faction, shipIds, dispatch]);

  return isLoading ? (
    <div>Loading ...</div>
  ) : (
    <>
      <Button
        onClick={() => {
          dispatch(newList(faction));
        }}
      >
        New List
      </Button>

      {shipIds.map((id, index) => (
        <ShipForm id={id} key={`${id}.${index}`} />
      ))}

      <Button
        onClick={() => {
          dispatch(addShip(faction as Faction));
        }}
      >
        Add Ship
      </Button>
    </>
  );
}
