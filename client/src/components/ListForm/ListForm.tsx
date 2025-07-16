import { Button } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import { useAppDispatch } from 'src/hooks';
import { selectConstructedShipOrderList } from 'src/state/selectors/list';
import { addShip, newList } from 'src/state/slices/listSlice';
import { Faction } from 'src/types';

import { PilotForm } from './PilotForm';
import { useFetchShipsByFactionQuery } from 'src/state/slices/apiSlice';

export function ListForm() {
  const { faction } = useParams();
  const constructedShipIds = useSelector(selectConstructedShipOrderList);
  const dispatch = useAppDispatch();
  
  const { isLoading } = useFetchShipsByFactionQuery(faction!);

  useEffect(() => {
    if (!isLoading && constructedShipIds.length === 0) {
      dispatch(newList(faction as Faction));
    }
  }, [isLoading, faction, constructedShipIds, dispatch]);

  return isLoading ? (
    <div>
      Loading ...
    </div>
  ) : (
    <>
      <Button
        onClick={() => {
          dispatch(newList(faction as Faction));
        }}
      >
        New List
      </Button>

      {constructedShipIds.map((id, index) => (
        <PilotForm id={id} key={`${id}.${index}`} />
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
