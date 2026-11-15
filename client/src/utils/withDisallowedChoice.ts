import { notAllowedLabel } from '@/strings/legality';

import type { SelectOption } from '@/types/selectOption';

/**
 * The options, plus the current choice marked as not allowed if the options leave it out. A
 * choice can become illegal after other changes (e.g. its required pilot is removed, or the format
 * changes); it stays visible so the player can see and replace it.
 */
export function withDisallowedChoice(
  options: SelectOption[],
  current?: SelectOption
): SelectOption[] {
  if (!current || options.some((option) => option.value === current.value)) {
    return options;
  }
  return [{ label: notAllowedLabel(current.label), value: current.value }, ...options];
}
