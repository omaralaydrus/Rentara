import { NextRequest, NextResponse } from 'next/server';
import { SandboxRequestError, sandboxGet } from '@core/http/sandbox.gateway';

const allowed = new Set(['ping', 'zones', 'license-types', 'business-activities', 'statistics']);
const cache = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
let windowStart = 0;
let calls = 0;

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const target = (await context.params).path.join('/');
  if (!allowed.has(target))
    return NextResponse.json({ message: 'Unknown reference resource.' }, { status: 404 });
  const query = new URLSearchParams();
  for (const key of ['offset', 'limit']) {
    const raw = request.nextUrl.searchParams.get(key);
    if (raw !== null) {
      const n = Number(raw);
      if (
        !/^\d+$/.test(raw) ||
        !Number.isSafeInteger(n) ||
        n < (key === 'limit' ? 1 : 0) ||
        n > (key === 'limit' ? 200 : 100000)
      ) {
        return NextResponse.json(
          { message: 'Invalid pagination. Use a nonnegative offset and limit from 1 to 200.' },
          { status: 400 },
        );
      }
      query.set(key, String(n));
    }
  }
  if (
    !['SANDBOX_CLIENT_ID', 'SANDBOX_CLIENT_SECRET', 'SANDBOX_USERNAME', 'SANDBOX_PASSWORD'].every(
      (key) => process.env[key],
    )
  ) {
    return NextResponse.json(
      {
        message:
          'The licensing reference connection is not configured. The server administrator can add the Rebana sandbox credentials.',
        code: 'NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }
  const search = query.size ? `?${query}` : '';
  const key = target + search;
  try {
    const hit = cache.get(key);
    if (hit && hit.expires > Date.now()) return NextResponse.json(hit.value);
    let task = pending.get(key);
    if (!task) {
      if (Date.now() - windowStart > 60000) {
        calls = 0;
        windowStart = Date.now();
      }
      if (++calls > 90)
        return NextResponse.json(
          {
            message: 'The reference service is busy. Please try again shortly.',
            code: 'SANDBOX_RATE_LIMITED',
            retryAfterSeconds: 60,
          },
          { status: 429, headers: { 'Retry-After': '60' } },
        );
      task = sandboxGet<Record<string, unknown>>(target, search)
        .then((value) => {
          // Do not publish the sandbox principal or token metadata through the public app.
          const safe = target === 'ping' ? { app: value.app, sandbox: value.sandbox } : value;
          if (cache.size >= 150) cache.delete(cache.keys().next().value!);
          cache.set(key, {
            expires: Date.now() + (target === 'statistics' ? 30000 : 300000),
            value: safe,
          });
          return safe;
        })
        .finally(() => pending.delete(key));
      pending.set(key, task);
    }
    return NextResponse.json(await task);
  } catch (error) {
    if (error instanceof SandboxRequestError && error.status === 429) {
      const retryAfterSeconds = Math.max(1, error.retryAfterSeconds ?? 60);
      return NextResponse.json(
        {
          message: 'The reference service rate limit was reached. Please try again later.',
          code: error.code,
          retryAfterSeconds,
        },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
      );
    }
    return NextResponse.json(
      { message: 'The licensing reference service is unavailable. Please try again later.' },
      { status: 502 },
    );
  }
}
