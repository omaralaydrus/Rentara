import { createAction } from '@reduxjs/toolkit';
import type { Home, Filters } from '@shared/models/rental.model';
export const loadHomes = createAction('[Homes] Load');
export const homesLoaded = createAction<Home[]>('[Homes] Loaded');
export const homesFailed = createAction<string>('[Homes] Failed');
export const setFilters = createAction<Partial<Filters>>('[Homes] Filter');
