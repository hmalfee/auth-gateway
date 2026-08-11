import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { createHandoff } from '@/lib/gateway';

export async function GET(request: NextRequest) {
    const returnTo = request.nextUrl.searchParams.get('return_to');
    if (!returnTo)
        return NextResponse.json(
            { error: 'Missing return_to' },
            { status: 400 },
        );

    const target = new URL(returnTo);
    const session = await auth.api.getSession({ headers: request.headers });

    if (session) {
        const token = createHandoff(
            target.host,
            target.pathname + target.search,
        );
        target.searchParams.set('__gw', token);
        return NextResponse.redirect(target, 302);
    }

    const loginUrl = new URL('/login', process.env.BETTER_AUTH_URL);
    loginUrl.searchParams.set('return_to', returnTo);
    return NextResponse.redirect(loginUrl, 302);
}
