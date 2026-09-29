import { createReducer } from '@reduxjs/toolkit';
import { initialState } from './home.state';
import { loadHomes, homesLoaded, homesFailed, setFilters } from './home.action';
export const homeReducer = createReducer(initialState, (b) =>
  b
    .addCase(loadHomes, (s) => {
      s.status = 'loading';
      s.error = '';
    })
    .addCase(homesLoaded, (s, a) => {
      s.status = 'ready';
      s.items = a.payload;
    })
    .addCase(homesFailed, (s, a) => {
      s.status = 'error';
      s.error = a.payload;
    })
    .addCase(setFilters, (s, a) => {
      s.filters = { ...s.filters, ...a.payload };
    }),
);
