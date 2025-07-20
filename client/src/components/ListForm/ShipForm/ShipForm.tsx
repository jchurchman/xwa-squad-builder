import { CloseOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';

import { useSelector } from 'react-redux';

import { useAppDispatch, useTypedParams } from '@hooks';
import { selectPilotsByPlatform, selectPlatformsByFaction, selectShipPlatform } from '@selectors';
import { deleteShip, selectPlatformId } from 'src/state/slices/listSlice';

import { RootState } from '@types';
import { SearchableSelect } from 'src/components/common';
import { HydratedPilot, HydratedPlatform } from '@shared/types';
import { useFetchPilotsByPlatformQuery } from 'src/state/slices/apiSlice';

type ShipFormProps = {
  id: string;
};

export function ShipForm({ id }: ShipFormProps) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();
  const platforms = useSelector((state: RootState) => selectPlatformsByFaction(state, faction));
  const selectedPlatform = useSelector((state: RootState) => selectShipPlatform(state, id));

  const pilots = useSelector((state: RootState) => selectPilotsByPlatform(state, selectedPlatform?.name))

  const { isLoading: pilotsLoading } = useFetchPilotsByPlatformQuery(selectedPlatform?.name || "");

  const onChange = (selectedChassisId: number) => {
    dispatch(selectPlatformId({ platformId: selectedChassisId, shipId: id }));
  };

  const onDeleteShip = () => {
    dispatch(deleteShip(id));
  };
console.log({ selectedPlatform, pilots })
  return (
    <>
      <div>Pilot form</div>
      <div>{id}</div>
      <SearchableSelect<HydratedPlatform>
        onChange={onChange}
        options={platforms}
        placeholder="Select a ship"
        value={selectedPlatform?.id}
      />
      {
        selectedPlatform && (
          <SearchableSelect<HydratedPilot>
            loading={pilotsLoading}
            placeholder="Select a pilot"
            options={pilots}
          />
        )
      }
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
