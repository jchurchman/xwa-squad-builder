import { useMemo } from 'react';

import { SearchableSelect } from '@components';
import { useUpgradeSelector } from '@hooks';

import classes from './ShipForm.module.scss';

type UpgradeSelectorProps = {
  shipId: string;
  slotId: string;
  slotType: string;
};

export function UpgradeSelector(props: UpgradeSelectorProps) {
  const { shipId, slotId, slotType } = props;

  const { allowClear, onClear, onSelect, options, selected } = useUpgradeSelector({
    shipId,
    slotId,
    slotType,
  });

  const formattedOptions = useMemo(() => {
    if (options.length === 0 && selected) {
      return [{ label: selected.name, value: selected.id }];
    }
    return options;
  }, [options, selected]);

  return (
    <SearchableSelect
      allowClear={allowClear}
      className={classes.upgradeSelect}
      onChange={onSelect}
      onClear={onClear}
      options={formattedOptions}
      placeholder={`Select a ${slotType}`}
      value={selected?.id}
    />
  );
}
