import { useParams } from "react-router";
import { useState, useMemo } from 'react'
import { Select } from 'antd'

import { useSelector } from "react-redux";
import { selectConstructedShipChassis, selectShipsByFaction } from "src/state/selectors";
import { RootState } from "src/state";
import { Faction } from "src/types";
import { useAppDispatch } from "src/hooks";
import { selectShipId } from "src/state/slices/listSlice";

type PilotFormProps = {
  id: string;
};

export function PilotForm({ id }: PilotFormProps) {
  const { faction } = useParams();
  const dispatch = useAppDispatch()
  const ships = useSelector((state: RootState) => selectShipsByFaction(state, faction as Faction))
  const [searchText, setSearchText] = useState<string>("")
  const selectedShipChassis = useSelector((state: RootState) => selectConstructedShipChassis(state, id))
console.log('selectedShipChassis ', selectedShipChassis)
  const shipOptions = useMemo(() => {
    return ships.map(ship => ({ label: ship.name, value: ship.id }))
  }, [ships])

  
  const filteredShips = useMemo(() => {
    if (searchText == "") {
      return shipOptions
    }

    return shipOptions.filter(ship => (ship?.label as string)?.toLowerCase().includes(searchText))
  }, [searchText, shipOptions])

  const onChange = (selectedChassisId: number) => {
    dispatch(selectShipId({ constructedShipId: id, chassisId: selectedChassisId}))
  }

  return (
    <>
      <div>Pilot form</div>
      <div>{id}</div>
      <Select
        showSearch
        placeholder="Select a ship"
        onChange={onChange}
        onSearch={setSearchText}
        options={filteredShips}
        value={selectedShipChassis?.id}
      />
    </>
  );
}
