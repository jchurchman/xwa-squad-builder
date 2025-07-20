import { configureStore } from '@reduxjs/toolkit';

import { api } from './slices/apiSlice';
import entitiesReducer from './slices/entitiesSlice';
import listReducer from './slices/listSlice';

export const store = configureStore({
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  reducer: {
    api: api.reducer,
    entities: entitiesReducer,
    list: listReducer,
  },
});
