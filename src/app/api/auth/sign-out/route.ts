import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { withForwardedCookies } from '@/lib/auth-response';
import { revokeAllGatewaySessions } from '@/lib/gateway';

export async function POST(request: NextRequest) {
    const { headers } = await auth.api.signOut({
        headers: request.headers,
        returnHeaders: true,
    });
    revokeAllGatewaySessions();
    return withForwardedCookies({ ok: true }, headers);
}
