import type { Filters, Home } from '../models/rental.model';
export function filterHomes(homes: Home[], f: Filters) {
  const query = f.query.toLowerCase().trim();
  return homes
    .filter(
      (h) =>
        h.published &&
        (!query || `${h.title} ${h.area} ${h.city}`.toLowerCase().includes(query)) &&
        (f.type === 'all' || h.type === f.type) &&
        h.rent <= f.maxRent &&
        h.beds >= f.beds &&
        (!f.furnished || h.furnished) &&
        (!f.pets || h.pets),
    )
    .sort((a, b) =>
      f.sort === 'price-low'
        ? a.rent - b.rent
        : f.sort === 'price-high'
          ? b.rent - a.rent
          : f.sort === 'space'
            ? b.sqft - a.sqft
            : 0,
    );
}
export const money = (value: number) =>
  new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 0,
  }).format(value);
export function estimate(home: Pick<Home, 'rent' | 'depositMonths'>) {
  return {
    firstMonth: home.rent,
    deposit: home.rent * home.depositMonths,
    total: home.rent * (1 + home.depositMonths),
  };
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
