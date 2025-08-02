import { useMemo } from 'react';

import { SearchableSelect } from '@components';

import classes from './ShipForm.module.scss';

import { HydratedUpgrade, UpgradeId } from '@shared/types';

type UpgradeSelectorProps = {
  onClear: () => void;
  onSelect: (upgradeId: UpgradeId) => void;
  options: HydratedUpgrade[];
  selected: HydratedUpgrade | null | undefined;
  slotType: string;
};

export function UpgradeSelector(props: UpgradeSelectorProps) {
  const { onClear, onSelect, options, selected, slotType } = props;

  const formattedOptions = useMemo(() => {
    return options.map((opt) => ({ label: opt.name, value: opt.id }));
  }, [options]);

  return (
    <SearchableSelect
      allowClear
      className={classes.upgradeSelect}
      onChange={onSelect}
      onClear={onClear}
      options={formattedOptions}
      placeholder={`Select a ${slotType}`}
      value={selected?.id}
    />
  );
}
