import { NextRequest, NextResponse } from 'next/server';
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function body(request: NextRequest): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new ApiError(415, 'Send JSON content.');
  const text = await request.text();
  if (text.length > 20000) throw new ApiError(413, 'This request is too large.');
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw 0;
    return value;
  } catch {
    throw new ApiError(400, 'Invalid request data.');
  }
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  // Next normalizes loopback nextUrl hostnames; compare the browser-facing Host.
  // Set APP_ORIGIN explicitly when deploying behind a TLS reverse proxy.
  const expected =
    process.env.APP_ORIGIN || `${request.nextUrl.protocol}//${request.headers.get('host')}`;
  if (!origin || origin !== expected)
    throw new ApiError(403, 'This action must come from Rentara.');
}
export function failure(error: unknown) {
  return NextResponse.json(
    {
      message:
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
    },
    { status: error instanceof ApiError ? error.status : 500 },
  );
}
export function field(value: unknown, label: string, min = 1, max = 200) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new ApiError(400, `${label} must be ${min}–${max} characters.`);
  return value.trim();
}
export function integer(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new ApiError(400, `${label} must be between ${min} and ${max}.`);
  return value;
}
