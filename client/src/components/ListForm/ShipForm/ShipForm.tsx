import { CloseOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { SearchableSelect } from '@components';
import { useAppDispatch, useShipForm } from '@hooks';
import { deleteShip } from 'src/state/slices/listSlice';

import type { HydratedPilot, HydratedPlatform } from '@shared/types';

type ShipFormProps = {
  id: string;
};

export function ShipForm({ id }: ShipFormProps) {
  const { pilot, platform } = useShipForm({ shipId: id });

  const dispatch = useAppDispatch();

  const onDeleteShip = () => {
    dispatch(deleteShip(id));
  };

  return (
    <>
      <SearchableSelect<HydratedPlatform>
        allowClear
        onChange={platform.onSelect}
        onClear={platform.onClear}
        options={platform.options}
        placeholder="Select a ship"
        value={platform.selected?.id}
      />
      {platform.selected && (
        <SearchableSelect<HydratedPilot>
          allowClear
          onChange={pilot.onSelect}
          onClear={pilot.onClear}
          options={pilot.options}
          placeholder="Select a pilot"
          value={pilot.selected?.id}
        />
      )}
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
