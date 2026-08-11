import { NextRequest, NextResponse } from 'next/server';

import {
    consumeHandoff,
    createGatewaySession,
    isValidGatewaySession,
} from '@/lib/gateway';

export async function GET(request: NextRequest) {
    const host = request.headers.get('x-forwarded-host') ?? '';
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const uri = request.headers.get('x-forwarded-uri') ?? '/';
    const url = new URL(uri, `${proto}://${host}`);

    const gwCookie = request.cookies.get('gw_session')?.value;
    if (gwCookie && isValidGatewaySession(gwCookie, host)) {
        return new NextResponse(null, { status: 200 });
    }

    const handoffToken = url.searchParams.get('__gw');
    if (handoffToken) {
        const handoff = consumeHandoff(handoffToken, host);
        if (handoff) {
            const session = createGatewaySession(host);
            const cleanUrl = new URL(handoff.returnPath, `${proto}://${host}`);

            const res = NextResponse.redirect(cleanUrl, 302);
            res.cookies.set('gw_session', session.token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/',
                expires: new Date(session.expiresAt),
            });
            return res;
        }
        // token invalid/expired/reused — fall through to a fresh authorize check
    }

    const returnTo = `${proto}://${host}${url.pathname}${url.search}`;
    const authorizeUrl = new URL(
        '/api/gateway/authorize',
        process.env.BETTER_AUTH_URL,
    );
    authorizeUrl.searchParams.set('return_to', returnTo);
    return NextResponse.redirect(authorizeUrl, 302);
}
