import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { SearchableSelect } from '@components';
import { useAppDispatch, useShipForm, useUpgradeSelect } from '@hooks';
import { deleteShip } from 'src/state/slices/listSlice';

import { ShipUpgradesForm } from './ShipUpgradesForm';

type ShipFormProps = {
  shipId: string;
};

export function ShipForm({ shipId }: ShipFormProps) {
  const { pilot, platform } = useShipForm({ shipId });
  useUpgradeSelect({ shipId });

  const dispatch = useAppDispatch();

  const onDeleteShip = () => {
    dispatch(deleteShip(shipId));
  };

  return (
    <>
      <SearchableSelect
        allowClear
        onChange={platform.onSelect}
        onClear={platform.onClear}
        options={platform.options}
        placeholder="Select a ship"
        value={platform.selected?.id}
      />
      {platform.selected && (
        <SearchableSelect
          allowClear
          onChange={pilot.onSelect}
          onClear={pilot.onClear}
          options={pilot.options}
          placeholder="Select a pilot"
          value={pilot.selected?.id}
        />
      )}
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
