import { Select } from 'antd';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import { useAppDispatch } from 'src/hooks';
import { RootState } from 'src/state';
import { selectShipChassis, selectPlatformsByFaction } from 'src/state/selectors';
import { selectPlatformId } from 'src/state/slices/listSlice';
import { Faction } from 'src/types';

type PilotFormProps = {
  id: string;
};

export function PilotForm({ id }: PilotFormProps) {
  const { faction } = useParams();
  const dispatch = useAppDispatch();
  const platforms = useSelector((state: RootState) =>
    selectPlatformsByFaction(state, faction as Faction)
  );
  const [searchText, setSearchText] = useState<string>('');
  const selectedPlatformChassis = useSelector((state: RootState) =>
    selectShipChassis(state, id)
  );
  console.log('selectedPlatformChassis ', selectedPlatformChassis);
  const platformOptions = useMemo(() => {
    return platforms.map((platform) => ({ label: platform.name, value: platform.id }));
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    if (searchText == '') {
      return platformOptions;
    }

    return platformOptions.filter((platform) =>
      (platform?.label as string)?.toLowerCase().includes(searchText)
    );
  }, [searchText, platformOptions]);

  const onChange = (selectedChassisId: number) => {
    dispatch(selectPlatformId({ chassisId: selectedChassisId, constructedPlatformId: id }));
  };

  return (
    <>
      <div>Pilot form</div>
      <div>{id}</div>
      <Select
        onChange={onChange}
        onSearch={setSearchText}
        options={filteredPlatforms}
        placeholder="Select a platform"
        showSearch
        value={selectedPlatformChassis?.id}
      />
    </>
  );
}
