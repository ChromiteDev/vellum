import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { requireFounder } from '$lib/server/admin';
import { ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
    await requireFounder(request);

    const q = (url.searchParams.get('q') ?? '').trim();
    if (!q || q.length > 50) {
        return json({ users: [] });
    }

    const pattern = `%${q}%`;
    const users = await db
        .select({
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            bio: user.bio,
            isAdmin: user.isAdmin,
            isFounder: user.isFounder,
            isBanned: user.isBanned,
            baseCurrencyBalance: user.baseCurrencyBalance,
            gems: user.gems,
            nameColor: user.nameColor,
            prestigeLevel: user.prestigeLevel,
            founderBadge: user.founderBadge,
        })
        .from(user)
        .where(or(ilike(user.username, pattern), ilike(user.name, pattern)))
        .orderBy(user.id)
        .limit(20);

    return json({
        users: users.map((u) => ({
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            bio: u.bio,
            isAdmin: !!u.isAdmin,
            isFounder: !!u.isFounder,
            isBanned: !!u.isBanned,
            baseCurrencyBalance: Number(u.baseCurrencyBalance ?? 0),
            gems: Number(u.gems ?? 0),
            nameColor: u.nameColor,
            prestigeLevel: Number(u.prestigeLevel ?? 0),
            founderBadge: !!u.founderBadge,
        })),
    });
};
