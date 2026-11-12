import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { cardServiceClient } from '@api';
import type { Ship, Upgrade } from 'src/gen/xwa/cards/v1/cards_pb';

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
    listUpgrades: builder.query<Upgrade[], void>({
      queryFn: async () => {
        try {
          const { upgrades } = await cardServiceClient.listUpgrades({});
          return { data: upgrades };
        } catch (error) {
          return { error: String(error) };
        }
      },
    }),
  }),
  reducerPath: 'api',
});

export const { useListShipsQuery, useListUpgradesQuery } = api;
