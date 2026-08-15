import type { GameKey } from '$lib/components/self/GameArt.svelte';

export interface GameMeta {
	key: GameKey;
	name: string;
	tagline: string;
	instructions: string;
	category: 'luck' | 'skill';
	difficulty: 'Easy' | 'Medium' | 'High';
	featured?: boolean;
	trending?: boolean;
	accent: string;
}

export const GAMES: GameMeta[] = [
	{
		key: 'coinflip',
		name: 'Coinflip',
		tagline: 'Pick a side. Double or nothing.',
		instructions: 'Choose heads or tails and wager. Win the flip and double your money.',
		category: 'luck',
		difficulty: 'Easy',
		featured: true,
		accent: 'from-amber-400/25 via-yellow-500/10'
	},
	{
		key: 'wheel',
		name: 'Wheel of Fortune',
		tagline: 'Spin the wheel. Test your luck.',
		instructions: 'Bet, spin, and let the wheel decide. Bigger multipliers hide on the edge.',
		category: 'luck',
		difficulty: 'Easy',
		trending: true,
		accent: 'from-violet-500/25 via-indigo-500/10'
	},
	{
		key: 'slots',
		name: 'Slots',
		tagline: 'Spin the reels. Chase the jackpot.',
		instructions: 'Match three symbols in a row to win. The rarer the set, the bigger the payout.',
		category: 'luck',
		difficulty: 'Easy',
		accent: 'from-fuchsia-500/25 via-purple-500/10'
	},
	{
		key: 'dice',
		name: 'Dice',
		tagline: 'Predict the roll for a 3x payout.',
		instructions: 'Pick a number 1-6. If the dice lands on it, you triple your wager.',
		category: 'luck',
		difficulty: 'Easy',
		accent: 'from-amber-400/25 via-yellow-500/10'
	},
	{
		key: 'mines',
		name: 'Mines',
		tagline: 'Reveal safe tiles. Dodge the bombs.',
		instructions: 'Reveal tiles one at a time. Each safe tile raises your multiplier. Hit a mine and it all goes.',
		category: 'skill',
		difficulty: 'High',
		accent: 'from-emerald-500/25 via-teal-500/10'
	},
	{
		key: 'tower',
		name: 'Tower',
		tagline: 'Climb as high as your nerve holds.',
		instructions: 'Pick a safe tile on each floor. Cash out before you hit a bomb.',
		category: 'skill',
		difficulty: 'Medium',
		accent: 'from-sky-500/25 via-blue-500/10'
	}
];
