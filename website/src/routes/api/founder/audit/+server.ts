import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auditLog, user } from '$lib/server/db/schema';
import { requireFounder } from '$lib/server/admin';
import { desc, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
    await requireFounder(request);

    const logs = await db
        .select()
        .from(auditLog)
        .orderBy(desc(auditLog.createdAt))
        .limit(100);

    const ids = new Set<number>();
    for (const log of logs) {
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
        logs: logs.map((log) => ({
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
