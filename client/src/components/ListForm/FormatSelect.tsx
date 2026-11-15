import { Segmented } from 'antd';

import { useFormatSelect } from '@/hooks/useFormatSelect';

export function FormatSelect() {
  const { onSelect, options, selected } = useFormatSelect();

  return <Segmented onChange={onSelect} options={options} value={selected} />;
}
