import { Alert, Button } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useAppDispatch, useFactionShips, useTypedParams } from '@hooks';
import { selectShipOrderIds } from '@selectors';
import { useUpgrades } from 'src/hooks/useUpgrades';
import { addShip, newList } from 'src/state/slices/listSlice';

import { ShipForm } from './ShipForm';

import classes from './ListForm.module.scss';

export function ListForm() {
  const { faction } = useTypedParams();
  const ships = useFactionShips();
  const upgrades = useUpgrades();
  const shipIds = useSelector(selectShipOrderIds);
  const dispatch = useAppDispatch();

  // A list belongs to one faction. Start a new one whenever the faction in the URL changes,
  // including through the browser's Back and Forward buttons.
  useEffect(() => {
    dispatch(newList());
  }, [faction, dispatch]);

  useEffect(() => {
    if (shipIds.length === 0) {
      dispatch(newList());
    }
  }, [shipIds, dispatch]);

  return (
    <>
      {(ships.isError || upgrades.isError) && (
        <Alert message="Could not load cards. Check that the backend is running." type="error" />
      )}
      <Button
        onClick={() => {
          dispatch(newList());
        }}
      >
        New List
      </Button>

      <div className={classes.shipContainer}>
        {shipIds.map((id, index) => (
          <div className={classes.shipRow} key={`${id}.${index}`}>
            <ShipForm shipId={id} />
          </div>
        ))}
      </div>
      <Button
        onClick={() => {
          dispatch(addShip());
        }}
      >
        Add Ship
      </Button>
    </>
  );
}
