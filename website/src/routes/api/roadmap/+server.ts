import { auth } from '$lib/auth';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { featureRequest, featureVote, user } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

const _CATEGORIES = ['General', 'Trading', 'Arcade', 'Marketplace', 'Profiles', 'Community', 'Economy', 'Other'] as const;

export async function GET({ request }) {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user ? Number(session.user.id) : null;

    const requests = await db
        .select({
            id: featureRequest.id,
            title: featureRequest.title,
            description: featureRequest.description,
            category: featureRequest.category,
            status: featureRequest.status,
            voteCount: featureRequest.voteCount,
            devResponse: featureRequest.devResponse,
            devRespondedAt: featureRequest.devRespondedAt,
            createdAt: featureRequest.createdAt,
            creatorId: featureRequest.creatorId,
            creatorUsername: user.username,
            creatorName: user.name,
        })
        .from(featureRequest)
        .leftJoin(user, eq(featureRequest.creatorId, user.id))
        .orderBy(desc(featureRequest.voteCount), desc(featureRequest.createdAt));

    let votedIds = new Set<number>();
    if (userId) {
        const votes = await db
            .select({ requestId: featureVote.requestId })
            .from(featureVote)
            .where(eq(featureVote.userId, userId));
        votedIds = new Set(votes.map((v) => v.requestId));
    }

    return json({
        requests: requests.map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            status: r.status,
            voteCount: r.voteCount,
            devResponse: r.devResponse,
            devRespondedAt: r.devRespondedAt,
            createdAt: r.createdAt,
            creatorUsername: r.creatorUsername ?? 'anonymous',
            creatorName: r.creatorName ?? 'Anonymous',
            userVoted: votedIds.has(r.id),
        })),
    });
}

export async function POST({ request }) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw error(401, 'Sign in to request a feature');

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : 'General';

    if (!title || title.length < 4 || title.length > 120) {
        throw error(400, 'Title must be 4-120 characters');
    }
    if (!description || description.length < 10 || description.length > 2000) {
        throw error(400, 'Description must be 10-2000 characters');
    }
    if (!(_CATEGORIES as readonly string[]).includes(category)) {
        throw error(400, 'Invalid category');
    }

    const [created] = await db
        .insert(featureRequest)
        .values({
            title,
            description,
            category,
            status: 'under_review',
            voteCount: 0,
            creatorId: Number(session.user.id),
        })
        .returning();

    return json({ success: true, request: created });
}
