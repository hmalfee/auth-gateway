import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';

export default async function HomePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect('/login');
    }

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
            <h1>Auth Gateway</h1>
            <p>You are logged in as {session.user.email}</p>
            <form action="/api/auth/sign-out" method="POST">
                <button type="submit">Sign Out</button>
            </form>
        </div>
    );
}
