import { Button } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import { useAppDispatch } from 'src/hooks';
import { selectShipOrderIds } from 'src/state/selectors/list';
import { useFetchPlatformsByFactionQuery } from 'src/state/slices/apiSlice';
import { addPlatform, newList } from 'src/state/slices/listSlice';
import { Faction } from 'src/types';

import { PilotForm } from './PilotForm';

export function ListForm() {
  const { faction } = useParams();
  const shipIds = useSelector(selectShipOrderIds);
  const dispatch = useAppDispatch();

  const { isLoading } = useFetchPlatformsByFactionQuery(faction!);

  useEffect(() => {
    if (!isLoading && shipIds.length === 0) {
      dispatch(newList(faction as Faction));
    }
  }, [isLoading, faction, shipIds, dispatch]);

  return isLoading ? (
    <div>Loading ...</div>
  ) : (
    <>
      <Button
        onClick={() => {
          dispatch(newList(faction as Faction));
        }}
      >
        New List
      </Button>

      {shipIds.map((id, index) => (
        <PilotForm id={id} key={`${id}.${index}`} />
      ))}

      <Button
        onClick={() => {
          dispatch(addPlatform(faction as Faction));
        }}
      >
        Add Platform
      </Button>
    </>
  );
}
