export type Rarity = 'uncommon' | 'rare' | 'epic' | 'legendary' | 'ethereal';

export interface GemPackage {
	id: string;
	productEnvKey: string;
	price: number;
	gems: number;
	bonusPct: number;
}

export interface NameColorItem {
	key: string;
	label: string;
	rarity: Rarity;
	price: number; // gems
	classes: string;
	style?: string;
}

export const GEM_PACKAGES: GemPackage[] = [
	{ id: 'starter', productEnvKey: 'PUBLIC_POLAR_PRODUCT_GEMS_500', price: 1.99, gems: 500, bonusPct: 0 },
	{ id: 'value', productEnvKey: 'PUBLIC_POLAR_PRODUCT_GEMS_1300', price: 4.99, gems: 1300, bonusPct: 5 },
	{ id: 'builder', productEnvKey: 'PUBLIC_POLAR_PRODUCT_GEMS_2800', price: 9.99, gems: 2800, bonusPct: 15 },
	{ id: 'whale', productEnvKey: 'PUBLIC_POLAR_PRODUCT_GEMS_8000', price: 24.99, gems: 8000, bonusPct: 30 },
];

export const RARITY_LABEL: Record<Rarity, string> = {
	uncommon: 'Uncommon',
	rare: 'Rare',
	epic: 'Epic',
	legendary: 'Legendary',
	ethereal: 'Ethereal',
};

export const RARITY_CLASS: Record<Rarity, string> = {
	uncommon: 'text-emerald-500',
	rare: 'text-blue-500',
	epic: 'text-purple-500',
	legendary: 'text-yellow-400',
	ethereal: 'text-fuchsia-500 dark:text-fuchsia-300',
};

export const NAME_COLOR_CATALOG: NameColorItem[] = [
	{ key: 'green', label: 'Green Candle', rarity: 'uncommon', price: 300, classes: 'text-green-500' },
	{ key: 'blue', label: 'Blue Chip', rarity: 'uncommon', price: 300, classes: 'text-blue-500' },
	{ key: 'orange', label: 'Orange Peel', rarity: 'uncommon', price: 400, classes: 'text-orange-400' },
	{ key: 'pink', label: 'Pink Panther', rarity: 'uncommon', price: 300, classes: 'text-pink-500' },
	{ key: 'cyan', label: 'Cyan Storm', rarity: 'uncommon', price: 350, classes: 'text-cyan-500' },
	{ key: 'lime', label: 'Lime Rush', rarity: 'uncommon', price: 350, classes: 'text-lime-500' },
	{ key: 'sky', label: 'Skyline', rarity: 'uncommon', price: 300, classes: 'text-sky-400' },
	{ key: 'teal', label: 'Deep Teal', rarity: 'rare', price: 650, classes: 'text-teal-400' },
	{ key: 'purple', label: 'Purple Haze', rarity: 'rare', price: 700, classes: 'text-purple-500' },
	{ key: 'red', label: 'Red Alert', rarity: 'rare', price: 700, classes: 'text-red-500' },
	{ key: 'violet', label: 'Ultraviolet', rarity: 'rare', price: 700, classes: 'text-violet-500' },
	{ key: 'amber', label: 'Amber Glow', rarity: 'rare', price: 650, classes: 'text-amber-400' },
	{ key: 'crimson', label: 'Crimson Tide', rarity: 'rare', price: 750, classes: 'text-rose-600' },
	{ key: 'emerald', label: 'Emerald Cut', rarity: 'rare', price: 650, classes: 'text-emerald-400' },
	{ key: 'gold', label: 'Gold Rush', rarity: 'epic', price: 1400, classes: 'text-yellow-400' },
	{
		key: 'fire',
		label: 'Degen Fire',
		rarity: 'epic',
		price: 1800,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #f97316, #ef4444, #f59e0b)',
	},
	{
		key: 'ocean',
		label: 'Ocean Wave',
		rarity: 'epic',
		price: 1600,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6)',
	},
	{
		key: 'sunset',
		label: 'Sunset Boulevard',
		rarity: 'epic',
		price: 1700,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #f97316, #ec4899, #8b5cf6)',
	},
	{
		key: 'frost',
		label: 'Frostbite',
		rarity: 'epic',
		price: 1500,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #7dd3fc, #e0f2fe, #a5b4fc)',
	},
	{
		key: 'neon',
		label: 'Neon Circuit',
		rarity: 'epic',
		price: 1800,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #22d3ee, #818cf8, #22d3ee)',
	},
	{
		key: 'lava',
		label: 'Lava Flow',
		rarity: 'epic',
		price: 1800,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #ef4444, #f97316, #fde047)',
	},
	{
		key: 'midnight',
		label: 'Midnight Galaxy',
		rarity: 'epic',
		price: 2000,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #818cf8, #7c3aed, #db2777)',
	},
	{
		key: 'mint',
		label: 'Mint Condition',
		rarity: 'epic',
		price: 1500,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #34d399, #a7f3d0, #10b981)',
	},
	{
		key: 'blood',
		label: 'Blood Moon',
		rarity: 'epic',
		price: 1900,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #b91c1c, #ef4444, #7f1d1d)',
	},
	{
		key: 'chrome',
		label: 'Chrome Vellum',
		rarity: 'legendary',
		price: 4500,
		classes: 'bg-clip-text text-transparent animate-vellum-chrome',
		style: 'background-image: linear-gradient(90deg, #94a3b8, #f8fafc, #94a3b8, #e2e8f0, #94a3b8)',
	},
	{
		key: 'obsidian',
		label: 'Obsidian Edge',
		rarity: 'legendary',
		price: 4800,
		classes: 'bg-clip-text text-transparent animate-vellum-chrome',
		style: 'background-image: linear-gradient(90deg, #64748b, #e2e8f0, #334155, #cbd5e1, #64748b)',
	},
	{
		key: 'royal',
		label: 'Royal Vellum',
		rarity: 'legendary',
		price: 5500,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #c4b5fd, #8b5cf6, #6366f1, #22d3ee)',
	},
	{
		key: 'ember',
		label: 'Living Ember',
		rarity: 'legendary',
		price: 5000,
		classes: 'bg-clip-text text-transparent animate-vellum-pulse',
		style: 'background-image: linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)',
	},
	{
		key: 'aurora',
		label: 'Aurora',
		rarity: 'legendary',
		price: 6000,
		classes: 'bg-clip-text text-transparent animate-vellum-hue',
		style: 'background-image: linear-gradient(90deg, #22d3ee, #a78bfa, #34d399, #22d3ee)',
	},
	{
		key: 'void',
		label: 'Void Walker',
		rarity: 'legendary',
		price: 6500,
		classes: 'bg-clip-text text-transparent animate-vellum-pulse',
		style: 'background-image: linear-gradient(90deg, #94a3b8, #f8fafc, #64748b)',
	},
	{
		key: 'phoenix',
		label: 'Phoenix',
		rarity: 'legendary',
		price: 5800,
		classes: 'bg-clip-text text-transparent animate-vellum-chrome',
		style: 'background-image: linear-gradient(90deg, #f97316, #ef4444, #fbbf24, #f97316)',
	},
	{
		key: 'galaxy',
		label: 'Galaxy',
		rarity: 'legendary',
		price: 5200,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(120deg, #7c3aed, #ec4899, #3b82f6)',
	},
	{
		key: 'halcyon',
		label: 'Halcyon',
		rarity: 'legendary',
		price: 4800,
		classes: 'bg-clip-text text-transparent',
		style: 'background-image: linear-gradient(90deg, #5eead4, #a5b4fc, #e0f2fe)',
	},
	{
		key: 'nova',
		label: 'Nova',
		rarity: 'legendary',
		price: 7000,
		classes: 'bg-clip-text text-transparent animate-vellum-hue',
		style: 'background-image: linear-gradient(90deg, #facc15, #fb7185, #c084fc, #facc15)',
	},
	{
		key: 'prism',
		label: 'Prism',
		rarity: 'legendary',
		price: 8000,
		classes: 'bg-clip-text text-transparent animate-vellum-chrome',
		style: 'background-image: linear-gradient(90deg, #f472b6, #a78bfa, #22d3ee, #34d399, #f472b6)',
	},
	{
		key: 'rainbow',
		label: 'Rainbow Baby',
		rarity: 'legendary',
		price: 4500,
		classes: 'bg-clip-text text-transparent animate-rainbow-text',
		style: 'background-image: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899)',
	},
	{
		key: 'diamond',
		label: 'Diamond Hands',
		rarity: 'legendary',
		price: 5000,
		classes: 'bg-clip-text text-transparent animate-diamond-shimmer',
		style: 'background-image: linear-gradient(135deg, #e2e8f0, #67e8f9, #c084fc, #e2e8f0)',
	},
	{
		key: 'vellum',
		label: 'Vellum Signature',
		rarity: 'ethereal',
		price: 12000,
		classes: 'bg-clip-text text-transparent animate-vellum-chrome',
		style: 'background-image: linear-gradient(90deg, #c4b5fd, #8b5cf6, #6366f1, #22d3ee, #c4b5fd)',
	},
	{
		key: 'seraphic',
		label: 'Seraphic',
		rarity: 'ethereal',
		price: 20000,
		classes: 'bg-clip-text text-transparent animate-vellum-hue',
		style: 'background-image: linear-gradient(90deg, #fef9c3, #e9d5ff, #c4b5fd, #99f6e4, #fef9c3)',
	},
];

export type CrateTierId = 'standard' | 'premium' | 'legendary' | 'mythic';

export interface CrateTier {
	id: CrateTierId;
	label: string;
	description: string;
	cost: number;
	accent: string;
	sprite: { idle: string; open: string };
	rewards: CrateRewardTier[];
}

export interface CrateRewardTier {
	weight: number;
	type: 'buss' | 'color';
	min: number;
	max: number;
	rarity: Rarity | null;
	label: string;
}

export const CRATE_TIERS: Record<CrateTierId, CrateTier> = {
	standard: {
		id: 'standard',
		label: 'Small Crate',
		description: 'Common rewards with a chance at uncommon colors.',
		cost: 150,
		accent: '#a0724a',
		sprite: { idle: '/chests/chest1_idle.png', open: '/chests/chest1_open.png' },
		rewards: [
			{ weight: 40, type: 'buss', min: 250,  max: 2000,  rarity: null,       label: '$250–2,000' },
			{ weight: 25, type: 'buss', min: 2000,  max: 5000,  rarity: null,       label: '$2,000–5,000' },
			{ weight: 25, type: 'color', min: 100,  max: 100,   rarity: 'uncommon', label: 'Uncommon color + $100' },
			{ weight: 10, type: 'color', min: 250,  max: 250,   rarity: 'rare',     label: 'Rare color + $250' },
		],
	},
	premium: {
		id: 'premium',
		label: 'Prime Crate',
		description: 'Better odds for rare and epic colors.',
		cost: 400,
		accent: '#5b8dd9',
		sprite: { idle: '/chests/chest2_idle.png', open: '/chests/chest2_open.png' },
		rewards: [
			{ weight: 25, type: 'buss',  min: 1000,  max: 5000,  rarity: null,       label: '$1,000–5,000' },
			{ weight: 15, type: 'buss',  min: 5000,  max: 15000, rarity: null,       label: '$5,000–15,000' },
			{ weight: 30, type: 'color', min: 500,   max: 500,   rarity: 'rare',     label: 'Rare color + $500' },
			{ weight: 22, type: 'color', min: 1500,  max: 1500,  rarity: 'epic',     label: 'Epic color + $1,500' },
			{ weight: 8,  type: 'color', min: 5000,  max: 5000,  rarity: 'legendary', label: 'Legendary color + $5,000' },
		],
	},
	legendary: {
		id: 'legendary',
		label: 'Motion Crate',
		description: 'High chance of rare+ colors. Best legendary odds.',
		cost: 1000,
		accent: '#e5a63b',
		sprite: { idle: '/chests/chest3_idle.png', open: '/chests/chest3_open.png' },
		rewards: [
			{ weight: 15, type: 'buss',  min: 5000,  max: 25000, rarity: null,       label: '$5,000–25,000' },
			{ weight: 30, type: 'color', min: 1000,  max: 1000,  rarity: 'rare',     label: 'Rare color + $1,000' },
			{ weight: 30, type: 'color', min: 2500,  max: 2500,  rarity: 'epic',     label: 'Epic color + $2,500' },
			{ weight: 25, type: 'color', min: 10000, max: 10000, rarity: 'legendary', label: 'Legendary color + $10,000' },
		],
	},
	mythic: {
		id: 'mythic',
		label: 'Auraful Crate',
		description: 'The ultimate crate. Very high chance of epic+ color.',
		cost: 2500,
		accent: '#c24adb',
		sprite: { idle: '/chests/chest4_idle.png', open: '/chests/chest4_open.png' },
		rewards: [
			{ weight: 10, type: 'buss',  min: 15000, max: 75000, rarity: null,       label: '$15,000–75,000' },
			{ weight: 35, type: 'color', min: 5000,  max: 5000,  rarity: 'epic',     label: 'Epic color + $5,000' },
			{ weight: 55, type: 'color', min: 20000, max: 20000, rarity: 'legendary', label: 'Legendary color + $20,000' },
		],
	},
};

export const CRATE_COST = CRATE_TIERS.standard.cost;

export function getColorByKey(key: string): NameColorItem | undefined {
	return NAME_COLOR_CATALOG.find((c) => c.key === key);
}
