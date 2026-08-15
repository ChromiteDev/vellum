import { error } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { auditLog, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

type GuardUser = {
    id: number;
    username: string;
    isAdmin: boolean | null;
    isFounder: boolean | null;
};

async function getSessionUser(request: Request): Promise<GuardUser> {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw error(401, 'Not authenticated');

    const [currentUser] = await db
        .select({
            id: user.id,
            username: user.username,
            isAdmin: user.isAdmin,
            isFounder: user.isFounder,
        })
        .from(user)
        .where(eq(user.id, Number(session.user.id)))
        .limit(1);

    if (!currentUser) throw error(401, 'Not authenticated');
    return currentUser;
}

export async function requireAdmin(request: Request): Promise<GuardUser> {
    const currentUser = await getSessionUser(request);
    if (!currentUser.isAdmin && !currentUser.isFounder) {
        throw error(403, 'Admin access required');
    }
    return currentUser;
}

export async function requireFounder(request: Request): Promise<GuardUser> {
    const currentUser = await getSessionUser(request);
    if (!currentUser.isFounder) throw error(403, 'Founder access required');
    return currentUser;
}

export async function recordAudit(input: {
    adminId: number;
    action: string;
    targetUserId?: number | null;
    currency?: 'currency' | 'gems' | null;
    amount?: string | null;
    previousValue?: string | null;
    newValue?: string | null;
    reason?: string | null;
    metadata?: string | null;
    ipAddress?: string | null;
}) {
    await db.insert(auditLog).values({
        adminId: input.adminId,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        currency: input.currency ?? null,
        amount: input.amount ?? null,
        previousValue: input.previousValue ?? null,
        newValue: input.newValue ?? null,
        reason: input.reason ?? null,
        metadata: input.metadata ?? null,
        ipAddress: input.ipAddress ?? null,
    });
}
