import { useEffect, useState } from 'react';

import { api, ApiError } from '../api/client';

export function useApiGet<T>(endpoint: string, options?: { skip?: boolean }) {
  const [data, setData] = useState<null | T>(null);
  const [loading, setLoading] = useState(!options?.skip);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (options?.skip) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await api.get<T>(endpoint);
        setData(result);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`HTTP ${err.status}: ${err.message}`);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint, options?.skip]);

  return { data, error, loading };
}
