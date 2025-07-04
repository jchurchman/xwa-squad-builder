import { useMemo, useState } from 'react';
import { Select } from 'antd';
import { DefaultOptionType } from 'antd/es/select';

type PilotFormProps = {
  ships: DefaultOptionType[];
  onChange: (value: string) => void;
  pilots: DefaultOptionType[];
}

export function PilotForm(props: PilotFormProps) {
  const { ships, onChange } = props;
  const [searchText, setSearchText] = useState<string>("")

  const filteredShips = useMemo(() => {
    if (searchText == "") {
      return ships
    }

    return ships.filter(ship => (ship?.label as string)?.toLowerCase().includes(searchText))
  }, [searchText, ships])


  return (
    <>
      <div>
        Pilot form
      </div>
      <Select
        showSearch
        placeholder="Select a ship"
        onChange={onChange}
        onSearch={setSearchText}
        options={filteredShips}
      />
    </>
  )
}