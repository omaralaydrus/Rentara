import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { database } from '@core/db/database';
import { ApiError, body, failure, field, sameOrigin } from '@core/http/api';
import {
  checkPassword,
  createSession,
  currentUser,
  endSession,
  hashPassword,
  throttleLogin,
} from '@core/auth/session';
import type { User } from '@shared/models/rental.model';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { user: currentUser(request) },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const data = await body(request);
    if (data.action === 'logout') {
      const response = NextResponse.json({ user: null });
      endSession(request, response);
      return response;
    }
    if (!['login', 'register'].includes(String(data.action)))
      throw new ApiError(400, 'Unknown account action.');
    const email = field(data.email, 'Email', 5, 180).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new ApiError(400, 'Enter a valid email address.');
    if (
      typeof data.password !== 'string' ||
      data.password.length < 10 ||
      data.password.length > 128
    )
      throw new ApiError(400, 'Password must be 10–128 characters.');
    const password = data.password;
    throttleLogin(email);
    const db = database();
    let user: User;
    if (data.action === 'register') {
      const name = field(data.name, 'Name', 2, 80);
      const hashed = await hashPassword(password);
      if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
        throw new ApiError(409, 'Unable to create an account with this email. Try signing in.');
      user = { id: randomUUID(), name, email };
      db.prepare('INSERT INTO users (id,name,email,password) VALUES (?,?,?,?)').run(
        user.id,
        name,
        email,
        hashed,
      );
    } else {
      const row = db.prepare('SELECT * FROM users WHERE email=?').get(email) as unknown as
        (User & { password: string }) | undefined;
      // Derive a key even when no account exists to reduce account timing differences.
      const valid = await checkPassword(
        password,
        row?.password ?? `${'0'.repeat(32)}:${'0'.repeat(128)}`,
      );
      if (!row || !valid) throw new ApiError(401, 'Email or password is incorrect.');
      user = { id: row.id, name: row.name, email: row.email };
    }
    const response = NextResponse.json({ user });
    createSession(response, user.id, request);
    return response;
  } catch (error) {
    return failure(error);
  }
}
