import { betterAuth } from 'better-auth';

import { db } from './db';

export const auth = betterAuth({
    database: db,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    trustedOrigins: (process.env.TRUSTED_ORIGINS ?? '')
        .split(',')
        .filter(Boolean),
    advanced: {
        useSecureCookies: true,
    },
});
