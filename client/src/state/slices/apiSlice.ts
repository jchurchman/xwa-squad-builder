import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { cardServiceClient } from '@api';
import type { Ship } from 'src/gen/xwa/cards/v1/cards_pb';

// Endpoints call the generated Connect client instead of building HTTP requests themselves.
export const api = createApi({
  baseQuery: fakeBaseQuery<string>(),
  endpoints: (builder) => ({
    listShips: builder.query<Ship[], string>({
      queryFn: async (factionXws) => {
        try {
          const { ships } = await cardServiceClient.listShips({ factionXws });
          return { data: ships };
        } catch (error) {
          return { error: String(error) };
        }
      },
    }),
  }),
  reducerPath: 'api',
});

export const { useListShipsQuery } = api;
