import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/index';
import { filterHomes } from '@shared/services/rental.logic';
export const selectHomeState = (s: RootState) => s.homes;
export const selectVisibleHomes = createSelector(selectHomeState, (s) =>
  filterHomes(s.items, s.filters),
);
