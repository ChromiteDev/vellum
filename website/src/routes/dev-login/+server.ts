import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { session, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createHmac, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

/**
 * Dev-only helper that signs you in as the founder/admin without Google OAuth.
 * Visit /dev-login in a browser to get a real session cookie.
 * This endpoint never exists in production builds (guarded by `dev`).
 */
export const GET = async () => {
    if (!dev) throw error(404, 'Not found');

    const secret = env.PRIVATE_BETTER_AUTH_SECRET;

    const founderByUsername = await db
        .select()
        .from(user)
        .where(eq(user.username, 'founder'))
        .limit(1);

    let founder = founderByUsername[0];
    if (!founder) {
        const admins = await db
            .select()
            .from(user)
            .where(eq(user.isAdmin, true))
            .limit(1);
        founder = admins[0];
    }

    if (!founder) throw error(500, 'No founder or admin user exists yet');

    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await db.insert(session).values({
        token,
        userId: founder.id,
        expiresAt,
    });

    const signature = createHmac('sha256', secret).update(token).digest('base64');
    const cookieValue = encodeURIComponent(`${token}.${signature}`);
    const maxAge = 30 * 24 * 60 * 60;

    const headers = new Headers();
    headers.set('Location', '/');
    headers.append(
        'Set-Cookie',
        `better-auth.session_token=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    );

    return new Response(null, { status: 302, headers });
};
