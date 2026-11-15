import { FORMAT_ORDER } from '@/constants';

import type { Format } from '@/types/format';

const FORMATS = new Set<string>(FORMAT_ORDER);

/** Whether a query parameter names a format the points source offers. */
export function isFormat(value: string | null): value is Format {
  return value !== null && FORMATS.has(value);
}
