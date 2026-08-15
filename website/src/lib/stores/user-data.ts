import { writable } from 'svelte/store';

export type User = {
    id: string;
    name: string;
    username: string;
    email: string;
    isAdmin: boolean;
    isFounder: boolean;
    image: string;
    isBanned: boolean;
    banReason: string | null;
    avatarUrl: string | null;

    baseCurrencyBalance: number;
    bio: string;

    volumeMaster: number;
    volumeMuted: boolean;

    nameColor: string | null;
    bannerImage: string | null;
    bannerColor: string | null;
    profileSong: string | null;
    profileSongName: string | null;
    founderBadge: boolean;
    prestigeLevel: number;
    disableMentions: boolean;
} | null;

export const USER_DATA = writable<User>(null);