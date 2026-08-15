import { auth } from '$lib/auth';
import { uploadBanner, uploadProfileSong, deleteObject } from '$lib/server/s3';
import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { MAX_FILE_SIZE, MAX_SONG_SIZE } from '$lib/data/constants';
import { BANNER_PRESET_KEYS } from '$lib/data/profile-customization';
import { clearUserCache } from '$lib/server/user-cache';

function sanitizeSongName(value: string | null): string | null {
    if (!value) return null;
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;
    return cleaned.slice(0, 80);
}

export async function POST({ request }) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) throw error(401, 'Not authenticated');

    const userId = Number(session.user.id);

    const formData = await request.formData();
    const bannerFile = formData.get('banner') as File | null;
    const bannerColor = formData.get('bannerColor') as string | null;
    const songFile = formData.get('song') as File | null;
    const songNameRaw = formData.get('songName');
    const songName = sanitizeSongName(songNameRaw as string | null);
    const songRemove = formData.get('songRemove') === '1';

    const [current] = await db
        .select({
            bannerImage: user.bannerImage,
            profileSong: user.profileSong,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (bannerFile && bannerFile.size > 0) {
        if (bannerFile.size > MAX_FILE_SIZE) {
            throw error(400, 'Banner image must be smaller than 1MB');
        }
        if (!bannerFile.type.startsWith('image/')) {
            throw error(400, 'Please select a valid image file');
        }
        try {
            const arrayBuffer = await bannerFile.arrayBuffer();
            const key = await uploadBanner(String(userId), new Uint8Array(arrayBuffer), bannerFile.type);
            updates.bannerImage = key;
            updates.bannerColor = null;
            if (current?.bannerImage && current.bannerImage !== key) {
                deleteObject(current.bannerImage).catch(() => {});
            }
        } catch (e) {
            console.error('Banner upload failed:', e);
            throw error(500, 'Banner upload failed');
        }
    } else if (bannerColor !== null && bannerColor !== undefined) {
        if (bannerColor === '') {
            if (current?.bannerImage) deleteObject(current.bannerImage).catch(() => {});
            updates.bannerImage = null;
            updates.bannerColor = null;
        } else if (BANNER_PRESET_KEYS.has(bannerColor)) {
            if (current?.bannerImage) deleteObject(current.bannerImage).catch(() => {});
            updates.bannerColor = bannerColor;
            updates.bannerImage = null;
        } else {
            throw error(400, 'Invalid banner preset');
        }
    }

    if (songRemove) {
        if (current?.profileSong) deleteObject(current.profileSong).catch(() => {});
        updates.profileSong = null;
        updates.profileSongName = null;
    } else if (songFile && songFile.size > 0) {
        if (songFile.size > MAX_SONG_SIZE) {
            throw error(400, 'Song must be smaller than 20MB');
        }
        if (!songFile.type.startsWith('audio/')) {
            throw error(400, 'Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, FLAC, or WebM)');
        }
        try {
            const arrayBuffer = await songFile.arrayBuffer();
            const key = await uploadProfileSong(String(userId), new Uint8Array(arrayBuffer), songFile.type);
            updates.profileSong = key;
            updates.profileSongName = songName ?? (songFile.name || 'Profile track');
            if (current?.profileSong && current.profileSong !== key) {
                deleteObject(current.profileSong).catch(() => {});
            }
        } catch (e: any) {
            if (e?.message?.startsWith('Unsupported')) {
                throw error(400, e.message);
            }
            console.error('Song upload failed:', e);
            throw error(500, 'Song upload failed');
        }
    } else if (songNameRaw !== null) {
        if (current?.profileSong) {
            updates.profileSongName = songName;
        }
    }

    await db
        .update(user)
        .set(updates)
        .where(eq(user.id, userId));

    clearUserCache(String(userId));

    return json({ success: true });
}
