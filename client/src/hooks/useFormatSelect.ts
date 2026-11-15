import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

import { FORMAT_ORDER, FORMAT_PARAM } from '@/constants';
import { FORMAT_NAMES } from '@/strings/formatNames';

import { useTypedParams } from './useTypedParams';

const FORMAT_OPTIONS = FORMAT_ORDER.map((format) => ({
  label: FORMAT_NAMES[format],
  value: format,
}));

/** The list's format, kept in the URL so it survives a reload. */
export function useFormatSelect() {
  const { format } = useTypedParams();
  const [, setSearchParams] = useSearchParams();

  const onSelect = useCallback(
    (value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set(FORMAT_PARAM, value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { onSelect, options: FORMAT_OPTIONS, selected: format };
}
