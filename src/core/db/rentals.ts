import 'server-only';
import { randomUUID } from 'node:crypto';
import { database } from './database';
import type { Home, HomeType, RentalRequest, User } from '@shared/models/rental.model';
import { ApiError, field, integer } from '@core/http/api';
import { validDate } from '@shared/services/rental.logic';
export function allHomes() {
  return (
    database().prepare('SELECT data FROM homes ORDER BY rowid DESC').all() as { data: string }[]
  ).map((row) => JSON.parse(row.data) as Home);
}
export function getHome(id: string) {
  const row = database().prepare('SELECT data FROM homes WHERE id=?').get(id) as
    { data: string } | undefined;
  if (!row) throw new ApiError(404, 'This home was not found.');
  return JSON.parse(row.data) as Home;
}
export function createHome(data: Record<string, unknown>, user: User) {
  const type = field(data.type, 'Property type') as HomeType;
  if (!['Apartment', 'Condominium', 'Terrace house', 'Detached house'].includes(type))
    throw new ApiError(400, 'Choose a valid property type.');
  const available = field(data.available, 'Available date');
  if (!validDate(available)) throw new ApiError(400, 'Choose a valid availability date.');
  if (allHomes().filter((h) => h.ownerId === user.id).length >= 50)
    throw new ApiError(400, 'You can list up to 50 properties.');
  const home: Home = {
    id: randomUUID(),
    ownerId: user.id,
    title: field(data.title, 'Title', 5, 100),
    city: field(data.city, 'City', 2, 80),
    area: field(data.area, 'Area', 2, 80),
    address: field(data.address, 'Address', 5, 200),
    description: field(data.description, 'Description', 30, 2000),
    type,
    rent: integer(data.rent, 'Monthly rent', 100, 100000),
    beds: integer(data.beds, 'Bedrooms', 1, 20),
    baths: integer(data.baths, 'Bathrooms', 1, 20),
    sqft: integer(data.sqft, 'Floor area', 100, 50000),
    depositMonths: integer(data.depositMonths, 'Deposit months', 0, 3),
    available,
    furnished: data.furnished === true,
    pets: data.pets === true,
    parking: data.parking === true,
    image: 'placeholder',
    demo: false,
    published: true,
  };
  database()
    .prepare('INSERT INTO homes (id,owner_id,data) VALUES (?,?,?)')
    .run(home.id, user.id, JSON.stringify(home));
  return home;
}
export function listRequests(user: User, incoming: boolean): RentalRequest[] {
  const rows = database()
    .prepare(
      `SELECT r.*,h.data,u.name AS tenant_name,u.email AS tenant_email FROM requests r JOIN homes h ON r.home_id=h.id JOIN users u ON r.tenant_id=u.id WHERE ${incoming ? 'h.owner_id' : 'r.tenant_id'}=? ORDER BY r.created_at DESC`,
    )
    .all(user.id) as Record<string, unknown>[];
  return rows.map((r) => {
    const home = JSON.parse(r.data as string) as Home;
    return {
      id: r.id as string,
      homeId: home.id,
      tenantId: r.tenant_id as string,
      moveIn: r.move_in as string,
      months: r.months as number,
      message: r.message as string,
      status: r.status as RentalRequest['status'],
      createdAt: r.created_at as string,
      homeTitle: home.title,
      homeImage: home.image,
      rent: home.rent,
      demo: home.demo,
      tenantName: r.tenant_name as string,
      tenantEmail: r.tenant_email as string,
      ...(r.status === 'accepted' && !home.demo
        ? (() => {
            const owner = database()
              .prepare('SELECT name,email FROM users WHERE id=?')
              .get(home.ownerId) as { name: string; email: string } | undefined;
            return owner ? { ownerName: owner.name, ownerEmail: owner.email } : {};
          })()
        : {}),
    };
  });
}
export function requestHome(data: Record<string, unknown>, user: User) {
  const home = getHome(field(data.homeId, 'Property'));
  if (!home.published) throw new ApiError(409, 'This home is no longer listed.');
  if (home.ownerId === user.id) throw new ApiError(400, 'You cannot request your own property.');
  const moveIn = field(data.moveIn, 'Move-in date');
  const today = new Date().toISOString().slice(0, 10);
  if (!validDate(moveIn) || moveIn < today || moveIn < home.available)
    throw new ApiError(
      400,
      'Choose a move-in date on or after the property’s availability and today.',
    );
  const months = integer(data.months, 'Lease length', 1, 36);
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (message.length > 1000) throw new ApiError(400, 'Keep your message within 1,000 characters.');
  const db = database();
  if (
    db
      .prepare(
        "SELECT id FROM requests WHERE home_id=? AND tenant_id=? AND status IN ('pending','accepted')",
      )
      .get(home.id, user.id)
  )
    throw new ApiError(409, 'You already have an active request for this home.');
  const id = randomUUID();
  db.prepare(
    'INSERT INTO requests (id,home_id,tenant_id,move_in,months,message,created_at) VALUES (?,?,?,?,?,?,?)',
  ).run(id, home.id, user.id, moveIn, months, message, new Date().toISOString());
  return { id };
}
export function updateRequest(data: Record<string, unknown>, user: User) {
  const id = field(data.id, 'Request ID');
  const row = database().prepare('SELECT * FROM requests WHERE id=?').get(id) as
    { home_id: string; tenant_id: string; status: string } | undefined;
  if (!row) throw new ApiError(404, 'Request not found.');
  const home = getHome(row.home_id);
  const status = data.status;
  if (status === 'cancelled') {
    if (row.tenant_id !== user.id)
      throw new ApiError(403, 'Only the renter can cancel this request.');
    if (!['pending', 'accepted'].includes(row.status))
      throw new ApiError(409, 'This request is already closed.');
  } else if (status === 'accepted' || status === 'declined') {
    if (home.ownerId !== user.id)
      throw new ApiError(403, 'Only this property’s owner can respond.');
    if (row.status !== 'pending')
      throw new ApiError(409, 'This request has already been answered.');
  } else throw new ApiError(400, 'Invalid request status.');
  const changed = database()
    .prepare('UPDATE requests SET status=? WHERE id=? AND status=?')
    .run(status, id, row.status);
  if (!changed.changes) throw new ApiError(409, 'The request changed. Refresh and try again.');
  return { ok: true };
}
