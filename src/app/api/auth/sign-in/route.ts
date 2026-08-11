import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { withForwardedCookies } from '@/lib/auth-response';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    try {
        const { headers, response } = await auth.api.signInEmail({
            body: { email, password },
            headers: request.headers,
            returnHeaders: true,
        });

        return withForwardedCookies(
            { user: { id: response.user.id, email: response.user.email } },
            headers,
        );
    } catch {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
}
