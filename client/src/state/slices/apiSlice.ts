import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

import { cardServiceClient } from '@/api/cardService';
import { pointsServiceClient } from '@/api/pointsService';
import type { Ship, Upgrade } from '@/gen/xwa/cards/v1/cards_pb';
import type { PointsVersion } from '@/gen/xwa/points/v1/points_pb';

// Endpoints call the generated Connect clients instead of building HTTP requests themselves.
export const api = createApi({
  baseQuery: fakeBaseQuery<string>(),
  endpoints: (builder) => ({
    getPointsVersion: builder.query<PointsVersion | undefined, string>({
      queryFn: async (source) => {
        try {
          const { version } = await pointsServiceClient.getPointsVersion({ source });
          return { data: version };
        } catch (error) {
          return { error: String(error) };
        }
      },
    }),
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

export const { useGetPointsVersionQuery, useListShipsQuery, useListUpgradesQuery } = api;
