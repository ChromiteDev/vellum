export interface BannerPreset {
	key: string;
	label: string;
	css: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
	{ key: 'violet', label: 'Violet', css: 'linear-gradient(120deg, #7c3aed, #4f46e5)' },
	{ key: 'ocean', label: 'Ocean', css: 'linear-gradient(120deg, #0ea5e9, #2563eb)' },
	{ key: 'sunset', label: 'Sunset', css: 'linear-gradient(120deg, #f43f5e, #f59e0b)' },
	{ key: 'emerald', label: 'Emerald', css: 'linear-gradient(120deg, #10b981, #059669)' },
	{ key: 'midnight', label: 'Midnight', css: 'linear-gradient(120deg, #1e293b, #0f172a)' },
	{ key: 'candy', label: 'Candy', css: 'linear-gradient(120deg, #ec4899, #8b5cf6)' },
	{ key: 'gold', label: 'Gold', css: 'linear-gradient(120deg, #f59e0b, #b45309)' },
	{ key: 'graphite', label: 'Graphite', css: 'linear-gradient(120deg, #52525b, #27272a)' }
];

export function getBannerPreset(key: string | null | undefined): BannerPreset | null {
	return BANNER_PRESETS.find((p) => p.key === key) ?? null;
}

export const BANNER_PRESET_KEYS = new Set(BANNER_PRESETS.map((p) => p.key));
