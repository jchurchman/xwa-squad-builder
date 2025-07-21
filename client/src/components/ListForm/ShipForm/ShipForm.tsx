import { CloseOutlined } from '@ant-design/icons';
import { HydratedPilot, HydratedPlatform } from '@shared/types';
import { Button } from 'antd';
import { useSelector } from 'react-redux';

import { useAppDispatch, useTypedParams } from '@hooks';
import { selectPilotsByPlatform, selectPlatformsByFaction, selectShipPlatform } from '@selectors';
import { SearchableSelect } from 'src/components/common';
import { deleteShip, selectPlatformId } from 'src/state/slices/listSlice';

import { RootState } from '@types';

type ShipFormProps = {
  id: string;
};

export function ShipForm({ id }: ShipFormProps) {
  const { faction } = useTypedParams();
  const dispatch = useAppDispatch();
  const platforms = useSelector((state: RootState) => selectPlatformsByFaction(state, faction));
  const selectedPlatform = useSelector((state: RootState) => selectShipPlatform(state, id));

  const pilots = useSelector((state: RootState) =>
    selectPilotsByPlatform(state, selectedPlatform?.name)
  );

  const onChange = (selectedChassisId: number) => {
    dispatch(selectPlatformId({ platformId: selectedChassisId, shipId: id }));
  };

  const onDeleteShip = () => {
    dispatch(deleteShip(id));
  };
  console.log({ pilots, selectedPlatform });
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
      {selectedPlatform && (
        <SearchableSelect<HydratedPilot> options={pilots} placeholder="Select a pilot" />
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
