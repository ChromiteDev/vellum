export const CACHE_TTL = 5 * 60 * 1000;

export const sessionCache = new Map<
	string,
	{
		userData: any;
		timestamp: number;
		ttl: number;
	}
>();

export function clearUserCache(userId: string) {
	sessionCache.delete(`user:${userId}`);
}
