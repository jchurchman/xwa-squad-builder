import { FORMAT } from '@/constants';

import type { Format } from '@/types/format';

/** Format names as players read them. */
export const FORMAT_NAMES: Record<Format, string> = {
  [FORMAT.EPIC]: 'Epic',
  [FORMAT.EXTENDED]: 'Extended',
  [FORMAT.STANDARD]: 'Standard',
};
