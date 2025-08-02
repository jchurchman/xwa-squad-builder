import { Button } from 'antd';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useAppDispatch, useTypedParams } from '@hooks';
import { selectShipOrderIds } from '@selectors';
import { addShip, newList } from 'src/state/slices/listSlice';

import { ShipForm } from './ShipForm';

import classes from './ListForm.module.scss';

export function ListForm() {
  const { faction } = useTypedParams();
  const shipIds = useSelector(selectShipOrderIds);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (shipIds.length === 0) {
      dispatch(newList());
    }
  }, [faction, shipIds, dispatch]);

  return (
    <>
      <Button
        onClick={() => {
          dispatch(newList());
        }}
      >
        New List
      </Button>

      <Button
        onClick={() => {
          dispatch(addShip());
        }}
      >
        Add Ship
      </Button>
      <div className={classes.shipContainer}>
        {shipIds.map((id, index) => (
          <div className={classes.shipRow} key={`${id}.${index}`}>
            <ShipForm shipId={id} />
          </div>
        ))}
      </div>
    </>
  );
}
