import { defaultFilters, type Home, type Filters } from '@shared/models/rental.model';
export interface HomeState {
  items: Home[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string;
  filters: Filters;
}
export const initialState: HomeState = {
  items: [],
  status: 'idle',
  error: '',
  filters: defaultFilters,
};
