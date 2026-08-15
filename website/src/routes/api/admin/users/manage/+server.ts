import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, session } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { recordAudit, requireAdmin } from '$lib/server/admin';
import { clearUserCache } from '$lib/server/user-cache';
import { deleteObject } from '$lib/server/s3';
import type { RequestHandler } from './$types';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const MAX_BALANCE = 1e18;
const MAX_PRESTIGE = 1000;

const ADMIN_ACTIONS = new Set([
    'ban',
    'unban',
    'set_name_color',
    'clear_name_color',
    'change_username',
    'clear_bio',
    'clear_banner',
    'clear_song',
    'force_logout',
]);

const FOUNDER_ACTIONS = new Set([
    'set_admin',
    'set_founder',
    'set_prestige',
    'set_balance',
    'set_gems',
    'grant_badge',
    'remove_badge',
    'delete_account',
]);

function requireReason(reason: string, action: string) {
    if (!reason || reason.length > 200) {
        throw error(400, `A reason up to 200 characters is required to ${action.replace(/_/g, ' ')}`);
    }
    return reason;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
    const actor = await requireAdmin(request);
    const isFounder = actor.isFounder === true;

    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === 'string' ? body.action : '';
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!action || (!ADMIN_ACTIONS.has(action) && !FOUNDER_ACTIONS.has(action))) {
        throw error(400, 'Invalid action');
    }
    if (FOUNDER_ACTIONS.has(action) && !isFounder) {
        throw error(403, 'Founder access required');
    }
    if (!username) throw error(400, 'Username is required');

    const [target] = await db.select().from(user).where(eq(user.username, username)).limit(1);
    if (!target) throw error(404, 'User not found');

    const ipAddress = getClientAddress() || null;

    const audit = (input: {
        action: string;
        previousValue?: string | null;
        newValue?: string | null;
        reason?: string | null;
        metadata?: string | null;
    }) =>
        recordAudit({
            adminId: actor.id,
            action: input.action,
            targetUserId: target.id,
            previousValue: input.previousValue ?? null,
            newValue: input.newValue ?? null,			reason: input.reason ?? (reason || null),
            metadata: input.metadata ?? null,
            ipAddress,
        });

    const isSelf = target.id === actor.id;

    switch (action) {
        case 'ban': {
            if (isSelf) throw error(400, 'You cannot ban yourself');
            if (target.isFounder) throw error(400, 'Cannot ban a founder');
            if (target.isAdmin && !isFounder) throw error(403, 'Cannot ban an admin');
            const r = requireReason(reason, 'ban');
            await db
                .update(user)
                .set({ isBanned: true, banReason: r, updatedAt: new Date() })
                .where(eq(user.id, target.id));
            await db.delete(session).where(eq(session.userId, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'ban', previousValue: 'false', newValue: 'true' });
            break;
        }
        case 'unban': {
            if (target.isFounder && !isFounder) throw error(403, 'Cannot unban a founder');
            await db
                .update(user)
                .set({ isBanned: false, banReason: null, updatedAt: new Date() })
                .where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'unban', previousValue: 'true', newValue: 'false' });
            break;
        }
        case 'set_name_color': {
            const value = typeof body.value === 'string' ? body.value.trim() : '';
            if (!value || value.length > 50) throw error(400, 'Invalid name color');
            await db.update(user).set({ nameColor: value }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'set_name_color', previousValue: target.nameColor, newValue: value });
            break;
        }
        case 'clear_name_color': {
            await db.update(user).set({ nameColor: null }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'clear_name_color', previousValue: target.nameColor, newValue: null });
            break;
        }
        case 'change_username': {
            const newUsername = typeof body.newUsername === 'string' ? body.newUsername.trim() : '';
            if (!USERNAME_RE.test(newUsername)) {
                throw error(400, 'Username must be 3-30 characters (letters, numbers, underscores)');
            }
            const [existing] = await db
                .select({ id: user.id })
                .from(user)
                .where(eq(user.username, newUsername))
                .limit(1);
            if (existing) throw error(400, 'Username already taken');
            requireReason(reason, 'change username');
            await db.update(user).set({ username: newUsername }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'change_username',
                previousValue: target.username,
                newValue: newUsername,
            });
            break;
        }
        case 'clear_bio': {
            requireReason(reason, 'clear bio');
            await db.update(user).set({ bio: null }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'clear_bio', previousValue: target.bio, newValue: null });
            break;
        }
        case 'clear_banner': {
            requireReason(reason, 'clear banner');
            await db
                .update(user)
                .set({ bannerImage: null, bannerColor: null })
                .where(eq(user.id, target.id));
            if (target.bannerImage) deleteObject(target.bannerImage).catch(() => {});
            clearUserCache(String(target.id));
            await audit({ action: 'clear_banner', previousValue: target.bannerImage ?? target.bannerColor, newValue: null });
            break;
        }
        case 'clear_song': {
            requireReason(reason, 'clear song');
            await db
                .update(user)
                .set({ profileSong: null, profileSongName: null })
                .where(eq(user.id, target.id));
            if (target.profileSong) deleteObject(target.profileSong).catch(() => {});
            clearUserCache(String(target.id));
            await audit({ action: 'clear_song', previousValue: target.profileSongName, newValue: null });
            break;
        }
        case 'force_logout': {
            requireReason(reason, 'force logout');
            await db.delete(session).where(eq(session.userId, target.id));
            await audit({ action: 'force_logout' });
            break;
        }
        case 'set_admin': {
            const value = body.value === true;
            await db.update(user).set({ isAdmin: value }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'set_admin',
                previousValue: String(!!target.isAdmin),
                newValue: String(value),
            });
            break;
        }
        case 'set_founder': {
            const value = body.value === true;
            if (isSelf && !value) throw error(400, 'You cannot remove your own founder status');
            if (!value) {
                const others = await db
                    .select({ id: user.id })
                    .from(user)
                    .where(eq(user.isFounder, true));
                if (others.length <= 1) throw error(400, 'Cannot remove the last founder');
            }
            await db.update(user).set({ isFounder: value }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'set_founder',
                previousValue: String(!!target.isFounder),
                newValue: String(value),
            });
            break;
        }
        case 'set_prestige': {
            const value = Math.trunc(Number(body.value));
            if (!Number.isFinite(value) || value < 0 || value > MAX_PRESTIGE) {
                throw error(400, `Prestige must be between 0 and ${MAX_PRESTIGE}`);
            }
            await db.update(user).set({ prestigeLevel: value }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'set_prestige',
                previousValue: String(target.prestigeLevel ?? 0),
                newValue: String(value),
            });
            break;
        }
        case 'set_balance': {
            const value = Number(body.value);
            if (!Number.isFinite(value) || value < 0 || value > MAX_BALANCE) {
                throw error(400, 'Balance must be between 0 and 1 quintillion');
            }
            const newValue = value.toFixed(8);
            await db.update(user).set({ baseCurrencyBalance: newValue }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'set_balance',
                previousValue: String(target.baseCurrencyBalance),
                newValue,
            });
            break;
        }
        case 'set_gems': {
            const value = Math.trunc(Number(body.value));
            if (!Number.isFinite(value) || value < 0 || value > MAX_BALANCE) {
                throw error(400, 'Gems must be between 0 and 1 quintillion');
            }
            await db.update(user).set({ gems: value }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({
                action: 'set_gems',
                previousValue: String(target.gems ?? 0),
                newValue: String(value),
            });
            break;
        }
        case 'grant_badge': {
            await db.update(user).set({ founderBadge: true }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'grant_badge', previousValue: String(!!target.founderBadge), newValue: 'true' });
            break;
        }
        case 'remove_badge': {
            await db.update(user).set({ founderBadge: false }).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await audit({ action: 'remove_badge', previousValue: String(!!target.founderBadge), newValue: 'false' });
            break;
        }
        case 'delete_account': {
            if (isSelf) throw error(400, 'You cannot delete your own account');
            if (target.isFounder) throw error(400, 'Cannot delete a founder');
            const r = requireReason(reason, 'delete account');
            await db.delete(user).where(eq(user.id, target.id));
            clearUserCache(String(target.id));
            await recordAudit({
                adminId: actor.id,
                action: 'delete_account',
                targetUserId: null,
                previousValue: username,
                newValue: null,
                reason: r,
                metadata: JSON.stringify({ id: target.id, username: target.username, name: target.name }),
                ipAddress,
            });
            break;
        }
    }

    return json({ success: true, action, username: target.username });
};
