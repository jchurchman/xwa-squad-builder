import { Select, SelectProps } from 'antd';
import { useMemo, useState } from 'react';

interface HasNameAndId {
  id: number;
  name: string;
}

interface SearchableSelectProps<T extends HasNameAndId>
  extends Omit<
    SelectProps<number>,
    'options' | 'onSearch' | 'showSearch' | 'filterOption' | 'onChange'
  > {
  onChange?: (value: number, selectedItem: T) => void;
  options: T[];
}

export function SearchableSelect<T extends HasNameAndId>({
  onChange,
  options,
  ...selectProps
}: SearchableSelectProps<T>) {
  const [searchText, setSearchText] = useState<string>('');

  const selectItems = useMemo(() => {
    return options.map((option) => ({ label: option.name, value: option.id }));
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
    const selectedItem = options.find((option) => option.id === value);
    if (onChange && selectedItem) {
      onChange(value, selectedItem);
    }
  };

  return (
    <Select<number>
      {...selectProps}
      filterOption={false}
      onChange={handleChange}
      onSearch={setSearchText}
      options={filteredSelectItems}
      showSearch
    />
  );
}
