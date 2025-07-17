import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { HydratedPilot, HydratedPlatform, HydratedUpgrade } from '@shared/types';

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    fetchPilotsByPlatform: builder.query<HydratedPilot[], string>({
      providesTags: ['Pilot'],
      query: (platformName) => `/pilots?platform=${encodeURIComponent(platformName)}`,
    }),
    fetchPlatformsByFaction: builder.query<HydratedPlatform[], string>({
      providesTags: ['Platform'],
      query: (faction) => `/platforms?faction=${encodeURIComponent(faction)}`,
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
  tagTypes: ['Platform', 'Pilot', 'Upgrade'],
});

export const {
  useFetchPilotsByPlatformQuery,
  useFetchPlatformsByFactionQuery,
  useFetchUpgradesBySlotsQuery,
} = api;
