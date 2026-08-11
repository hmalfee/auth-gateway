import { APIError } from 'better-auth/api';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';
import { withForwardedCookies } from '@/lib/auth-response';

export async function POST(request: NextRequest) {
    const { name, email, password } = await request.json();

    try {
        const { headers, response } = await auth.api.signUpEmail({
            body: { name, email, password },
            headers: request.headers,
            returnHeaders: true,
        });

        return withForwardedCookies(
            { user: { id: response.user.id, email: response.user.email } },
            headers,
            201,
        );
    } catch (error) {
        if (error instanceof APIError) {
            const status = error.statusCode || 400;
            return Response.json({ error: error.message }, { status });
        }
        throw error;
    }
}
