import { Select, SelectProps } from 'antd';
import { useMemo, useState } from 'react';

interface HasNameAndId {
  name: string;
  id: number;
}

interface SearchableSelectProps<T extends HasNameAndId> 
  extends Omit<SelectProps<number>, 'options' | 'onSearch' | 'showSearch' | 'filterOption' | 'onChange'> {
  options: T[];
  onChange?: (value: number, selectedItem: T) => void;
}

export function SearchableSelect<T extends HasNameAndId>({ 
  options, 
  onChange, 
  ...selectProps 
}: SearchableSelectProps<T>) {
  const [searchText, setSearchText] = useState<string>('');

  const selectItems = useMemo(() => {
    return options.map(option => ({ label: option.name, value: option.id }));
  }, [options]);

  const filteredSelectItems = useMemo(() => {
    if (searchText === '') {
      return selectItems;
    }

    return selectItems.filter((option) =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, selectItems]);

  const handleChange = (value: number) => {
    const selectedItem = options.find(option => option.id === value);
    if (onChange && selectedItem) {
      onChange(value, selectedItem);
    }
  };

  return (
    <Select<number>
      {...selectProps}
      options={filteredSelectItems}
      onChange={handleChange}
      onSearch={setSearchText}
      showSearch
      filterOption={false}
    />
  );
}