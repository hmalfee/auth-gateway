'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const returnTo = params.get('return_to');
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            try {
                const res = await fetch('/api/auth/sign-in', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password'),
                    }),
                });

                if (!res.ok) {
                    const data = await res
                        .json()
                        .catch(() => ({ error: 'Something went wrong' }));
                    setError(data.error || 'Something went wrong');
                    return;
                }

                if (returnTo) {
                    router.push(
                        `/api/gateway/authorize?return_to=${encodeURIComponent(returnTo)}`,
                    );
                    return;
                }
                router.push('/');
            } catch (_) {
                setError('Network error occurred');
            }
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-destructive text-sm font-medium">
                            {error}
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isPending}
                    >
                        {isPending ? 'Signing in...' : 'Sign in'}
                    </Button>
                    <div className="text-center text-sm">
                        Don&apos;t have an account?{' '}
                        <Link
                            href={`/signup${returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : ''}`}
                            className="underline underline-offset-4"
                        >
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Loading...</CardTitle>
                    </CardHeader>
                </Card>
            }
        >
            <LoginForm />
        </Suspense>
    );
}
