import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@core/auth/session';
import {
  allHomes,
  createHome,
  getHome,
  listRequests,
  requestHome,
  updateRequest,
} from '@core/db/rentals';
import { database } from '@core/db/database';
import { ApiError, body, failure, field, sameOrigin } from '@core/http/api';
export const runtime = 'nodejs';
type Context = { params: Promise<{ resource: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    if (resource === 'homes')
      return NextResponse.json(
        allHomes().filter((h) => h.published),
        { headers: { 'Cache-Control': 'no-store' } },
      );
    const user = requireUser(request);
    if (resource === 'dashboard')
      return NextResponse.json(
        {
          homes: allHomes().filter((h) => h.ownerId === user.id),
          outgoing: listRequests(user, false),
          incoming: listRequests(user, true),
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    throw new ApiError(404, 'Resource not found.');
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const user = requireUser(request);
    const data = await body(request);
    const { resource } = await context.params;
    if (resource === 'homes') return NextResponse.json(createHome(data, user), { status: 201 });
    if (resource === 'requests') return NextResponse.json(requestHome(data, user), { status: 201 });
    throw new ApiError(404, 'Resource not found.');
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: NextRequest, context: Context) {
  try {
    sameOrigin(request);
    const user = requireUser(request);
    const data = await body(request);
    const { resource } = await context.params;
    if (resource === 'requests') return NextResponse.json(updateRequest(data, user));
    if (resource === 'homes') {
      const home = getHome(field(data.id, 'Property ID'));
      if (home.ownerId !== user.id)
        throw new ApiError(403, 'Only the owner can change this listing.');
      if (typeof data.published !== 'boolean')
        throw new ApiError(400, 'Choose a listing visibility.');
      home.published = data.published;
      database().prepare('UPDATE homes SET data=? WHERE id=?').run(JSON.stringify(home), home.id);
      return NextResponse.json(home);
    }
    throw new ApiError(404, 'Resource not found.');
  } catch (error) {
    return failure(error);
  }
}
