import { auth } from '$lib/auth';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { featureRequest, featureVote } from '$lib/server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function POST({ request, params }) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw error(401, 'Sign in to vote');
    const userId = Number(session.user.id);
    const requestId = Number(params.id);

    if (!Number.isInteger(requestId) || requestId <= 0) throw error(400, 'Invalid request');

    const [target] = await db
        .select({ id: featureRequest.id })
        .from(featureRequest)
        .where(eq(featureRequest.id, requestId))
        .limit(1);
    if (!target) throw error(404, 'Request not found');

    const [existing] = await db
        .select({ id: featureVote.id })
        .from(featureVote)
        .where(and(eq(featureVote.userId, userId), eq(featureVote.requestId, requestId)))
        .limit(1);

    const voted = !existing;

    await db.transaction(async (tx) => {
        if (existing) {
            await tx.delete(featureVote).where(eq(featureVote.id, existing.id));
            await tx
                .update(featureRequest)
                .set({ voteCount: sql`GREATEST(0, vote_count - 1)` })
                .where(eq(featureRequest.id, requestId));
        } else {
            await tx.insert(featureVote).values({ userId, requestId });
            await tx
                .update(featureRequest)
                .set({ voteCount: sql`vote_count + 1` })
                .where(eq(featureRequest.id, requestId));
        }
    });

    const [updated] = await db
        .select({ voteCount: featureRequest.voteCount })
        .from(featureRequest)
        .where(eq(featureRequest.id, requestId))
        .limit(1);

    return json({ success: true, voted, voteCount: updated?.voteCount ?? 0 });
}
