import { Select, SelectProps } from 'antd';
import { DefaultOptionType } from 'antd/es/select';

interface SearchableSelectProps
  extends Omit<SelectProps<number>, 'onSearch' | 'showSearch' | 'filterOption' | 'onChange'> {
  onChange?: (value: number) => void;
}

function filterOptions(inputValue: string, option?: DefaultOptionType) {
  if (!option?.label || typeof option.label !== 'string') {
    return false;
  }
  return option.label.toLowerCase().includes(inputValue.toLowerCase());
}

export function SearchableSelect({
  onChange,
  options = [],
  ...selectProps
}: SearchableSelectProps) {
  const handleChange = (value: number) => {
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <Select<number>
      {...selectProps}
      filterOption={filterOptions}
      onChange={handleChange}
      options={options}
      showSearch
    />
  );
}
