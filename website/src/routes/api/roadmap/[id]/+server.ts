import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { featureRequest } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordAudit, requireAdmin } from '$lib/server/admin';

const _STATUSES = ['under_review', 'planned', 'in_development', 'testing', 'released', 'declined'] as const;

export async function POST({ request, params, getClientAddress }) {
    const actor = await requireAdmin(request);
    const requestId = Number(params.id);
    if (!Number.isInteger(requestId) || requestId <= 0) throw error(400, 'Invalid request');

    const body = await request.json().catch(() => ({}));
    const status = typeof body.status === 'string' ? body.status : '';
    const devResponse = typeof body.devResponse === 'string' ? body.devResponse.trim() : '';
    const clearResponse = body.clearResponse === true;

    if (!(_STATUSES as readonly string[]).includes(status)) throw error(400, 'Invalid status');

    const [target] = await db
        .select()
        .from(featureRequest)
        .where(eq(featureRequest.id, requestId))
        .limit(1);
    if (!target) throw error(404, 'Request not found');

    const updates: Record<string, unknown> = { status, updatedAt: new Date() };
    if (clearResponse) {
        updates.devResponse = null;
        updates.devRespondedAt = null;
    } else if (devResponse) {
        updates.devResponse = devResponse.slice(0, 2000);
        updates.devRespondedAt = new Date();
    }

    await db.update(featureRequest).set(updates).where(eq(featureRequest.id, requestId));

    await recordAudit({
        adminId: actor.id,
        action: 'roadmap_status',
        targetUserId: target.creatorId,
        previousValue: target.status,
        newValue: status,
        reason: devResponse || null,
        metadata: JSON.stringify({ requestId, title: target.title }),
        ipAddress: getClientAddress() || null,
    });

    return json({ success: true, status });
}
