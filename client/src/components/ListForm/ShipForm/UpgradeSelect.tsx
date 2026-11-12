import { SearchableSelect } from '@components';
import { useUpgradeSelect } from 'src/hooks/useUpgradeSelect';

import classes from './ShipForm.module.scss';

type UpgradeSelectProps = {
  shipId: string;
  slotId: string;
  slotType: string;
};

export function UpgradeSelect({ shipId, slotId, slotType }: UpgradeSelectProps) {
  const { isLoading, onClear, onSelect, options, selected } = useUpgradeSelect({
    shipId,
    slotId,
    slotType,
  });

  return (
    <SearchableSelect
      allowClear
      className={classes.upgradeSelect}
      loading={isLoading}
      onChange={onSelect}
      onClear={onClear}
      options={options}
      placeholder={`Select a ${slotType}`}
      value={selected}
    />
  );
}
