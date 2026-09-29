export type HomeType = 'Apartment' | 'Condominium' | 'Terrace house' | 'Detached house';
export interface Home {
  id: string;
  ownerId: string;
  title: string;
  city: string;
  area: string;
  address: string;
  type: HomeType;
  rent: number;
  beds: number;
  baths: number;
  sqft: number;
  furnished: boolean;
  pets: boolean;
  parking: boolean;
  image: string;
  description: string;
  available: string;
  depositMonths: number;
  demo: boolean;
  published: boolean;
}
export interface User {
  id: string;
  name: string;
  email: string;
}
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export interface RentalRequest {
  id: string;
  homeId: string;
  tenantId: string;
  moveIn: string;
  months: number;
  message: string;
  status: RequestStatus;
  createdAt: string;
  homeTitle: string;
  homeImage: string;
  rent: number;
  demo: boolean;
  tenantName: string;
  tenantEmail: string;
  ownerName?: string;
  ownerEmail?: string;
}
export interface Filters {
  query: string;
  type: string;
  maxRent: number;
  beds: number;
  furnished: boolean;
  pets: boolean;
  sort: string;
}
export const defaultFilters: Filters = {
  query: '',
  type: 'all',
  maxRent: 15000,
  beds: 0,
  furnished: false,
  pets: false,
  sort: 'recommended',
};
