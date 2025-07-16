import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { HydratedPilot, HydratedShip, HydratedUpgrade } from '@shared/types';

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    fetchPilotsByShip: builder.query<HydratedPilot[], string>({
      providesTags: ['Pilot'],
      query: (shipName) => `/pilots?ship=${encodeURIComponent(shipName)}`,
    }),
    fetchShipsByFaction: builder.query<HydratedShip[], string>({
      providesTags: ['Ship'],
      query: (faction) => `/ships?faction=${encodeURIComponent(faction)}`,
    }),
    fetchUpgradesBySlots: builder.query<HydratedUpgrade[], string[]>({
      providesTags: ['Upgrade'],
      query: (slots) => {
        const slotsParam = slots.map((slot) => `slots=${encodeURIComponent(slot)}`).join('&');
        return `/upgrades?${slotsParam}`;
      },
    }),
  }),
  reducerPath: 'api',
  tagTypes: ['Ship', 'Pilot', 'Upgrade'],
});

export const { useFetchPilotsByShipQuery, useFetchShipsByFactionQuery, useFetchUpgradesBySlotsQuery } =
  api;
