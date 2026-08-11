import { NextResponse } from 'next/server';

export function withForwardedCookies(
    json: unknown,
    authHeaders: Headers,
    status = 200,
) {
    const response = NextResponse.json(json, { status });
    for (const cookie of authHeaders.getSetCookie()) {
        response.headers.append('set-cookie', cookie);
    }
    return response;
}
