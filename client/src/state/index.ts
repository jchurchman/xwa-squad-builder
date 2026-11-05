import { configureStore } from '@reduxjs/toolkit';

import { api } from './slices/apiSlice';
import listReducer from './slices/listSlice';

export const store = configureStore({
  devTools: true,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  reducer: {
    api: api.reducer,
    list: listReducer,
  },
});
