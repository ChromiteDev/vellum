import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/admin';
import { desc, ilike, or } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const USER_FIELDS = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    isAdmin: user.isAdmin,
    isFounder: user.isFounder,
    isBanned: user.isBanned,
    banReason: user.banReason,
    createdAt: user.createdAt,
    baseCurrencyBalance: user.baseCurrencyBalance,
    gems: user.gems,
    nameColor: user.nameColor,
    prestigeLevel: user.prestigeLevel,
    founderBadge: user.founderBadge,
};

export const GET: RequestHandler = async ({ request, url }) => {
    await requireAdmin(request);

    const q = (url.searchParams.get('q') ?? '').trim().slice(0, 50);

    const rows = q
        ? await db
              .select(USER_FIELDS)
              .from(user)
              .where(or(ilike(user.username, `%${q}%`), ilike(user.name, `%${q}%`)))
              .orderBy(user.id)
              .limit(20)
        : await db
              .select(USER_FIELDS)
              .from(user)
              .orderBy(desc(user.createdAt))
              .limit(50);

    return json({
        users: rows.map((u) => ({
            id: u.id,
            name: u.name,
            username: u.username,
            email: u.email,
            bio: u.bio,
            isAdmin: !!u.isAdmin,
            isFounder: !!u.isFounder,
            isBanned: !!u.isBanned,
            banReason: u.banReason,
            createdAt: u.createdAt,
            baseCurrencyBalance: Number(u.baseCurrencyBalance ?? 0),
            gems: Number(u.gems ?? 0),
            nameColor: u.nameColor,
            prestigeLevel: Number(u.prestigeLevel ?? 0),
            founderBadge: !!u.founderBadge,
        })),
    });
};
