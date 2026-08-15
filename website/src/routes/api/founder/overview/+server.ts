import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auditLog, coin, transaction, user } from '$lib/server/db/schema';
import { requireFounder } from '$lib/server/admin';
import { count, desc, eq, gte, inArray, sum, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
    await requireFounder(request);

    const now = Date.now();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totals] = await db
        .select({
            totalUsers: count(),
            totalGems: sum(user.gems),
            totalCurrency: sum(user.baseCurrencyBalance),
        })
        .from(user);

    const [active] = await db
        .select({ activeUsers24h: count() })
        .from(user)
        .where(gte(user.updatedAt, dayAgo));

    const [newUsers] = await db
        .select({ newUsers7d: count() })
        .from(user)
        .where(gte(user.createdAt, weekAgo));

    const [banned] = await db
        .select({ bannedUsers: count() })
        .from(user)
        .where(eq(user.isBanned, true));

    const [volume] = await db
        .select({ volume24h: sum(transaction.totalBaseCurrencyAmount) })
        .from(transaction)
        .where(gte(transaction.timestamp, dayAgo));

    const [market] = await db
        .select({
            totalCoins: count(),
            totalMarketCap: sum(coin.marketCap),
            totalVolume24h: sum(coin.volume24h),
        })
        .from(coin);

    const [txCount] = await db
        .select({ totalTransactions: count() })
        .from(transaction);

    const [arcade] = await db
        .select({
            totalWagered: sum(user.totalArcadeWagered),
            totalGames: sum(user.totalArcadeGamesPlayed),
            totalCrates: sum(user.cratesOpened),
        })
        .from(user);

    const topHolders = await db
        .select({
            id: user.id,
            username: user.username,
            name: user.name,
            image: user.image,
            nameColor: user.nameColor,
            founderBadge: user.founderBadge,
            baseCurrencyBalance: user.baseCurrencyBalance,
            gems: user.gems,
        })
        .from(user)
        .orderBy(desc(sql`CAST(${user.baseCurrencyBalance} AS NUMERIC)`))
        .limit(10);

    const recentLogs = await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(10);

    const ids = new Set<number>();
    for (const log of recentLogs) {
        ids.add(log.adminId);
        if (log.targetUserId) ids.add(log.targetUserId);
    }

    const relatedUsers = ids.size
        ? await db
              .select({ id: user.id, username: user.username })
              .from(user)
              .where(inArray(user.id, [...ids]))
        : [];
    const usernameMap = new Map(relatedUsers.map((u) => [u.id, u.username]));

    return json({
        totalUsers: Number(totals.totalUsers ?? 0),
        totalGems: Number(totals.totalGems ?? 0),
        totalCurrency: Number(totals.totalCurrency ?? 0),
        activeUsers24h: Number(active.activeUsers24h ?? 0),
        newUsers7d: Number(newUsers.newUsers7d ?? 0),
        bannedUsers: Number(banned.bannedUsers ?? 0),
        volume24h: Number(volume.volume24h ?? 0),
        totalCoins: Number(market.totalCoins ?? 0),
        totalMarketCap: Number(market.totalMarketCap ?? 0),
        totalCoinVolume24h: Number(market.totalVolume24h ?? 0),
        totalTransactions: Number(txCount.totalTransactions ?? 0),
        totalArcadeWagered: Number(arcade.totalWagered ?? 0),
        totalArcadeGames: Number(arcade.totalGames ?? 0),
        totalCratesOpened: Number(arcade.totalCrates ?? 0),
        topHolders: topHolders.map((h) => ({
            id: h.id,
            username: h.username,
            name: h.name,
            image: h.image,
            nameColor: h.nameColor,
            founderBadge: h.founderBadge,
            balance: Number(h.baseCurrencyBalance),
            gems: Number(h.gems),
        })),
        recentAudit: recentLogs.map((log) => ({
            id: log.id,
            action: log.action,
            admin: usernameMap.get(log.adminId) ?? `#${log.adminId}`,
            target: log.targetUserId ? (usernameMap.get(log.targetUserId) ?? `#${log.targetUserId}`) : null,
            currency: log.currency,
            amount: log.amount,
            previousValue: log.previousValue,
            newValue: log.newValue,
            reason: log.reason,
            createdAt: log.createdAt,
        })),
    });
};
