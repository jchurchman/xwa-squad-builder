import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { SearchableSelect } from '@components';
import { useAppDispatch, useShipForm } from '@hooks';
import { deleteShip } from 'src/state/slices/listSlice';

import { ShipUpgradesForm } from './ShipUpgradesForm';

import classes from './ShipForm.module.scss';

type ShipFormProps = {
  shipId: string;
};

export function ShipForm({ shipId }: ShipFormProps) {
  const { pilot, platform } = useShipForm({ shipId });

  const dispatch = useAppDispatch();

  const onDeleteShip = () => {
    dispatch(deleteShip(shipId));
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <SearchableSelect
          allowClear
          className={classes.platformSelect}
          onChange={platform.onSelect}
          onClear={platform.onClear}
          options={platform.options}
          placeholder="Select a ship"
          value={platform.selected?.id}
        />
        {platform.selected && (
          <SearchableSelect
            allowClear
            className={classes.pilotSelect}
            onChange={pilot.onSelect}
            onClear={pilot.onClear}
            options={pilot.options}
            placeholder="Select a pilot"
            value={pilot.selected?.id}
          />
        )}
      </div>
      {/** TODO: Add pilot ponts/loadout */}
      <ShipUpgradesForm shipId={shipId} />
      <Button
        danger
        icon={<CloseOutlined />}
        onClick={onDeleteShip}
        shape="circle"
        type="primary"
      />
    </>
  );
}
