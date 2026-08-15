import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordAudit, requireFounder } from '$lib/server/admin';
import type { RequestHandler } from './$types';

const MAX_GRANT_AMOUNT = 1e18;

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    const founder = await requireFounder(request);

    const body = await request.json().catch(() => ({}));
    const userId = Number(body.userId);
    const type = body.type;
    const action = body.action;
    const amount = Number(body.amount);
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!Number.isInteger(userId) || userId <= 0) throw error(400, 'Invalid user');
    if (type !== 'currency' && type !== 'gems') throw error(400, 'Invalid asset type');
    if (action !== 'grant' && action !== 'remove') throw error(400, 'Invalid action');
    if (!Number.isFinite(amount) || amount <= 0) throw error(400, 'Amount must be positive');
    if (amount > MAX_GRANT_AMOUNT) throw error(400, 'Amount exceeds the maximum grant of 1,000,000,000,000,000,000');
    if (!reason || reason.length > 200) throw error(400, 'A reason up to 200 characters is required');

    const [target] = await db
        .select({
            id: user.id,
            username: user.username,
            baseCurrencyBalance: user.baseCurrencyBalance,
            gems: user.gems,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    if (!target) throw error(404, 'User not found');

    const delta = action === 'remove' ? -amount : amount;
    const previousValue = type === 'currency' ? String(target.baseCurrencyBalance) : String(target.gems);
    const newNumber = Number(previousValue) + delta;

    if (newNumber < 0) throw error(400, 'Resulting balance would go below zero');

    let newValue: string;
    if (type === 'currency') {
        newValue = newNumber.toFixed(8);
        await db.update(user).set({ baseCurrencyBalance: newValue }).where(eq(user.id, userId));
    } else {
        newValue = String(Math.round(newNumber));
        await db.update(user).set({ gems: Math.round(newNumber) }).where(eq(user.id, userId));
    }

    await recordAudit({
        adminId: founder.id,
        action: `${action}_${type}`,
        targetUserId: userId,
        currency: type,
        amount: String(amount),
        previousValue,
        newValue,
        reason,
        ipAddress: getClientAddress() || null,
    });

    return json({
        success: true,
        userId,
        username: target.username,
        type,
        action,
        previousValue,
        newValue,
    });
};
