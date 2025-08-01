import { useMemo } from 'react';

import { SearchableSelect } from '@components';

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
      onChange={onSelect}
      onClear={onClear}
      options={formattedOptions}
      placeholder={`Select a ${slotType}`}
      value={selected?.id}
    />
  );
}
