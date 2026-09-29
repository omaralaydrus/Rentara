import 'server-only';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { NextRequest, NextResponse } from 'next/server';
import { database } from '@core/db/database';
import { ApiError } from '@core/http/api';
import type { User } from '@shared/models/rental.model';
const derive = promisify(scrypt);
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await derive(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}
export async function checkPassword(password: string, stored: string) {
  const [salt, key] = stored.split(':');
  const derived = (await derive(password, salt, 64)) as Buffer;
  const expected = Buffer.from(key, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
export function currentUser(request: NextRequest): User | null {
  const token = request.cookies.get('rentara_session')?.value;
  if (!token) return null;
  const db = database();
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  return (
    (db
      .prepare(
        'SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?',
      )
      .get(hashToken(token), Date.now()) as unknown as User) ?? null
  );
}
export function requireUser(request: NextRequest) {
  const user = currentUser(request);
  if (!user) throw new ApiError(401, 'Sign in to continue.');
  return user;
}
export function createSession(response: NextResponse, userId: string, request: NextRequest) {
  const existing = request.cookies.get('rentara_session')?.value;
  if (existing) database().prepare('DELETE FROM sessions WHERE token=?').run(hashToken(existing));
  const token = randomBytes(32).toString('hex');
  database()
    .prepare('INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)')
    .run(hashToken(token), userId, Date.now() + 7 * 86400000);
  response.cookies.set('rentara_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 86400,
  });
}
export function endSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get('rentara_session')?.value;
  if (token) database().prepare('DELETE FROM sessions WHERE token=?').run(hashToken(token));
  response.cookies.set('rentara_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });
}
const attempts = new Map<string, { count: number; until: number }>();
export function throttleLogin(email: string) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  if (attempts.size >= 5000) throw new ApiError(429, 'Account services are busy. Try again later.');
  const key = email.toLowerCase();
  const entry = attempts.get(key) ?? { count: 0, until: now + 15 * 60000 };
  if (++entry.count > 15) throw new ApiError(429, 'Too many attempts. Try again in 15 minutes.');
  attempts.set(key, entry);
}
