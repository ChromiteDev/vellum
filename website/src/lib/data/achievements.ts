export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export type AchievementCategory =
	| 'trading'
	| 'wealth'
	| 'creation'
	| 'arcade'
	| 'streaks'
	| 'prestige'
	| 'hopium'
	| 'social'
	| 'shop'
	| 'special'
	| 'season';

export interface AchievementDef {
	id: string;
	name: string;
	description: string;
	icon: string;
	difficulty: AchievementDifficulty;
	cashReward: number;
	gemReward: number;
	category: AchievementCategory;
	targetValue?: number;
}

export const DIFFICULTY_LABEL: Record<AchievementDifficulty, string> = {
	easy: 'Easy',
	medium: 'Medium',
	hard: 'Hard',
	legendary: 'Legendary',
};

export const DIFFICULTY_CLASS: Record<AchievementDifficulty, string> = {
	easy: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
	medium: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
	hard: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
	legendary: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
};

export const CATEGORY_LABEL: Record<AchievementCategory, string> = {
	trading: 'Trading',
	wealth: 'Wealth',
	creation: 'Coin Creation',
	arcade: 'Arcade',
	streaks: 'Daily Rewards & Streaks',
	prestige: 'Prestige',
	hopium: 'Hopium',
	social: 'Social',
	shop: 'Shop & Cosmetics',
	special: 'Special',
	season: 'Seasons',
};

export const ACHIEVEMENTS: AchievementDef[] = [
	// TRADING (12)
	{ id: 'first_buy', name: "Baby's First Buy", description: 'Buy any coin for the first time', icon: 'green_coin.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'trading' },
	{ id: 'first_sell', name: 'Paper Hands', description: 'Sell a coin for the first time', icon: 'red_cash.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'trading' },
	{ id: 'trades_50', name: 'Market Regular', description: 'Complete 50 trades', icon: 'bronze_medal.png', difficulty: 'medium', cashReward: 5000, gemReward: 15, category: 'trading', targetValue: 50 },
	{ id: 'trades_500', name: 'Trading Machine', description: 'Complete 500 trades', icon: 'silver_medal.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'trading', targetValue: 500 },
	{ id: 'trades_5000', name: 'Wolf of Wall Street', description: 'Complete 5,000 trades', icon: 'golden_medal.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'trading', targetValue: 5000 },
	{ id: 'dip_buyer', name: 'Dip Buyer', description: 'Buy a coin that\'s down 50%+ in the last 24h', icon: 'shovel.png', difficulty: 'medium', cashReward: 5000, gemReward: 15, category: 'trading' },
	{ id: 'whale_trade', name: 'Whale Trade', description: 'Make a single trade worth $100,000+', icon: 'blue_diamond.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'trading' },
	{ id: 'hold_10_coins', name: 'Diversified', description: 'Hold 10 different coins at the same time', icon: 'shield.png', difficulty: 'medium', cashReward: 5000, gemReward: 15, category: 'trading', targetValue: 10 },
	{ id: 'hold_25_coins', name: 'Index Fund', description: 'Hold 25 different coins at the same time', icon: 'chest.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'trading', targetValue: 25 },
	{ id: 'yolo', name: 'YOLO', description: 'Spend $50,000+ on a single trade', icon: 'bomb.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'trading' },
	{ id: 'volume_10m', name: 'Volume King', description: 'Accumulate $10,000,000 in total trading volume', icon: 'crown.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'trading', targetValue: 10000000 },
	{ id: 'diamond_hands', name: 'Diamond Hands', description: 'Hold a single coin for 30+ days', icon: 'gold_diamond.png', difficulty: 'hard', cashReward: 15000, gemReward: 75, category: 'trading' },
	{ id: 'true_dedication', name: 'True dedication', description: 'Invest $1,000+ in a coin 14 days in a row without ever selling', icon: 'heart.png', difficulty: 'hard', cashReward: 20000, gemReward: 50, category: 'trading', targetValue: 14 },

	// WEALTH (5)
	{ id: 'portfolio_1k', name: 'First Comma', description: 'Reach $1,000 total portfolio value', icon: 'green_cash.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'wealth' },
	{ id: 'portfolio_100k', name: 'Six Figures', description: 'Reach $100,000 total portfolio value', icon: 'blue_cash.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'wealth' },
	{ id: 'portfolio_1m', name: 'Millionaire', description: 'Reach $1,000,000 total portfolio value', icon: 'purple_cash.png', difficulty: 'hard', cashReward: 15000, gemReward: 75, category: 'wealth' },
	{ id: 'portfolio_1b', name: 'Billionaire', description: 'Reach $1,000,000,000 total portfolio value', icon: 'gold_coin.png', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'wealth' },
	{ id: 'broke', name: 'Down Bad', description: 'Have less than $1 in your account', icon: 'red_crystal.png', difficulty: 'easy', cashReward: 2500, gemReward: 10, category: 'wealth' },

	// COIN CREATION (5)
	{ id: 'create_coin', name: 'Minter', description: 'Create your first coin', icon: 'green_crystal.png', difficulty: 'easy', cashReward: 2000, gemReward: 10, category: 'creation' },
	{ id: 'create_5', name: 'Serial Minter', description: 'Create 5 coins', icon: 'blue_crystal.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'creation', targetValue: 5 },
	{ id: 'create_25', name: 'Coin Factory', description: 'Create 25 coins', icon: 'yellow_crystal.png', difficulty: 'hard', cashReward: 25000, gemReward: 100, category: 'creation', targetValue: 25 },
	{ id: 'moon_100x', name: 'To The Moon', description: 'Have a coin you created reach $1 (1,000,000x its starting price)', icon: 'rocket.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'creation' },
	{ id: 'rug_pull', name: 'Dump Lord', description: 'Crash a coin\'s price by 50% or more in a single sell', icon: 'sword.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'creation' },

	// ARCADE (11)
	{ id: 'first_arcade', name: 'Feeling Lucky', description: 'Play your first arcade game', icon: 'dice.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'arcade' },
	{ id: 'slots_jackpot', name: 'Jackpot!', description: 'Hit a 3-of-a-kind on slots', icon: 'luckyblock.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'arcade' },
	{ id: 'mines_15', name: 'Minesweeper Pro', description: 'Reveal 15+ safe tiles in a single mines game and cash out', icon: 'clover.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'arcade' },
	{ id: 'mines_24', name: 'Minesweeper God', description: 'Win with 24 mines enabled', icon: 'skull.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'arcade' },
	{ id: 'mines_21', name: 'Cloud 9', description: 'Reveal all 22 safe tiles with 3 mines and cash out', icon: 'cloud.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'arcade' },
	{ id: 'arcade_100', name: 'Degen', description: 'Play 100 arcade games', icon: 'target.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'arcade', targetValue: 100 },
	{ id: 'arcade_wager_100k', name: 'High Roller', description: 'Wager $100,000+ total across arcade games', icon: 'purple_diamond.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'arcade', targetValue: 100000 },
	{ id: 'arcade_losses_50k', name: 'House Always Wins', description: 'Lose $50,000+ total in the arcade', icon: 'red_diamond.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'arcade', targetValue: 50000 },
	{ id: 'win_streak_5', name: 'Lucky Streak', description: 'Win 5 arcade games in a row', icon: 'torch_yellow.png', difficulty: 'hard', cashReward: 15000, gemReward: 75, category: 'arcade', targetValue: 5 },
	{ id: 'arcade_wins_500k', name: 'Professional Gambler', description: 'Win $500,000+ total in the arcade', icon: 'trophy.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'arcade', targetValue: 500000 },
	{ id: 'arcade_wins_1m', name: 'All I do is Win', description: 'Make $1,000,000 winnings with arcade games', icon: 'fire.png', difficulty: 'legendary', cashReward: 100000, gemReward: 225, category: 'arcade', targetValue: 1000000 },
	{ id: 'risk_biscuit', name: 'Risk it for the biscuit', description: 'Go all in with at least $25,000 and win', icon: 'warning.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'arcade', targetValue: 25000 },
	{ id: 'arcade_losses_1m', name: 'All I do is Lose', description: 'Lose $1,000,000 within arcade games', icon: 'x.png', difficulty: 'legendary', cashReward: 100000, gemReward: 225, category: 'arcade', targetValue: 1000000 },

	// DAILY REWARDS & STREAKS (5)
	{ id: 'first_claim', name: 'Early Bird', description: 'Claim your first daily reward', icon: 'gift.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'streaks' },
	{ id: 'streak_7', name: 'Dedicated', description: 'Reach a 7-day login streak', icon: 'calendar.png', difficulty: 'medium', cashReward: 5000, gemReward: 15, category: 'streaks', targetValue: 7 },
	{ id: 'streak_14', name: 'Committed', description: 'Reach a 14-day login streak', icon: 'torch_green.png', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'streaks', targetValue: 14 },
	{ id: 'streak_30', name: 'Obsessed', description: 'Reach a 30-day login streak', icon: 'torch_purple.png', difficulty: 'hard', cashReward: 20000, gemReward: 75, category: 'streaks', targetValue: 30 },
	{ id: 'rewards_100k', name: 'Rewards Collector', description: 'Claim $100,000 total in daily rewards', icon: 'magnet.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'streaks', targetValue: 100000 },

	// PRESTIGE (3)
	{ id: 'prestige_1', name: 'Reset Button', description: 'Prestige for the first time', icon: 'teleporter.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'prestige' },
	{ id: 'prestige_3', name: 'Grindset', description: 'Reach Prestige III', icon: 'scroll.png', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'prestige', targetValue: 3 },
	{ id: 'prestige_5', name: 'Ascended', description: 'Reach Prestige V (max prestige)', icon: 'green_diamond.png', difficulty: 'legendary', cashReward: 50000, gemReward: 200, category: 'prestige', targetValue: 5 },

	// HOPIUM (4)
	{ id: 'first_bet', name: 'Crystal Ball', description: 'Place your first Hopium bet', icon: 'balloon.png', difficulty: 'easy', cashReward: 1000, gemReward: 5, category: 'hopium' },
	{ id: 'create_10_questions', name: 'Question Master', description: 'Create 10 Hopium questions', icon: 'pencil.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'hopium', targetValue: 10 },
	{ id: 'win_10_bets', name: 'Oracle', description: 'Win 10 Hopium bets', icon: 'book.png', difficulty: 'medium', cashReward: 10000, gemReward: 25, category: 'hopium', targetValue: 10 },
	{ id: 'win_50_bets', name: 'Prophet', description: 'Win 50 Hopium bets', icon: 'key.png', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'hopium', targetValue: 50 },

	// SOCIAL (7)
	{ id: 'comments_25', name: 'Socialite', description: 'Post 25 comments on coin pages', icon: 'locationpin.png', difficulty: 'medium', cashReward: 5000, gemReward: 15, category: 'social', targetValue: 25 },
	{ id: 'comments_50', name: 'Yapper', description: 'Write 50 comments in total', icon: 'chat.png', difficulty: 'medium', cashReward: 7500, gemReward: 15, category: 'social', targetValue: 50 },
	{ id: 'top_rugpuller', name: 'Top Dumper', description: 'Be the #1 dumper on the daily leaderboard', icon: 'smiling_face_with_horns.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'social' },
	{ id: 'transfers_10_users', name: 'Generous', description: 'Send transfers to 10 different users', icon: 'creditcard.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'social', targetValue: 10 },
	{ id: 'transfer_500k', name: 'Big Tipper', description: 'Transfer $500,000+ total to other users', icon: 'wheat.png', difficulty: 'hard', cashReward: 25000, gemReward: 75, category: 'social', targetValue: 500000 },
	{ id: 'received_from_15', name: 'A Celebrity?', description: 'Have 15 unique people send you cash', icon: 'ticket.png', difficulty: 'hard', cashReward: 20000, gemReward: 25, category: 'social', targetValue: 15 },
	{ id: 'update_bio', name: 'Who are you?', description: 'Update your About Me section', icon: 'save.png', difficulty: 'easy', cashReward: 2000, gemReward: 10, category: 'social' },

	// SHOP & COSMETICS (2)
	{ id: 'own_10_colors', name: 'Collector', description: 'Own 10 different name colors', icon: 'lock.png', difficulty: 'hard', cashReward: 10000, gemReward: 50, category: 'shop', targetValue: 10 },
	{ id: 'open_50_crates', name: 'Crate Addict', description: 'Open 50 crates', icon: 'box.png', difficulty: 'hard', cashReward: 15000, gemReward: 75, category: 'shop', targetValue: 50 },

	//SPECIAL (2)
	{ id: 'all_in', name: 'All In', description: 'Spend 95%+ of your balance in a single trade', icon: 'clock.png', difficulty: 'medium', cashReward: 5000, gemReward: 25, category: 'special' },
	{ id: 'account_6mo', name: 'Veteran', description: 'Have an account older than 6 months', icon: 'shoe.png', difficulty: 'medium', cashReward: 10000, gemReward: 50, category: 'special' },

	{ id: 'season_entry', name: 'Clean Slate', description: 'Enter a ranked season and burn everything above the stake', icon: 'season_clean_slate.png', difficulty: 'easy', cashReward: 2500, gemReward: 10, category: 'season' },
	{ id: 'season_double', name: 'Doubled Down', description: 'Double your starting stake in a season', icon: 'season_doubled_down.png', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'season', targetValue: 2 },
	{ id: 'season_10x', name: 'Order of Magnitude', description: 'Reach 10x your starting stake in a season', icon: 'season_order_of_magnitude.png', difficulty: 'hard', cashReward: 25000, gemReward: 75, category: 'season', targetValue: 10 },
	{ id: 'season_100x', name: 'Parabolic', description: 'Reach 100x your starting stake in a season', icon: 'season_parabolic.png', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'season', targetValue: 100 },
	{ id: 'season_podium', name: 'On The Podium', description: 'Finish a season in the top 3', icon: 'season_podium.png', difficulty: 'hard', cashReward: 30000, gemReward: 100, category: 'season', targetValue: 3 },
	{ id: 'season_champion', name: 'Season Champion', description: 'Win a season outright', icon: 'season_champion.png', difficulty: 'legendary', cashReward: 100000, gemReward: 300, category: 'season' },
	{ id: 'season_dynasty', name: 'Dynasty', description: 'Win two separate seasons', icon: 'season_dynasty.png', difficulty: 'legendary', cashReward: 250000, gemReward: 500, category: 'season', targetValue: 2 },
	{ id: 'season_regular', name: 'Regular', description: 'Compete in 3 different seasons', icon: 'season_regular.png', difficulty: 'medium', cashReward: 10000, gemReward: 30, category: 'season', targetValue: 3 },
	{ id: 'season_veteran', name: 'Old Guard', description: 'Compete in 10 different seasons', icon: 'season_old_guard.png', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'season', targetValue: 10 },
	{ id: 'season_underdog', name: 'Underdog', description: 'Finish top 10 in a season', icon: 'season_underdog.png', difficulty: 'hard', cashReward: 20000, gemReward: 75, category: 'season', targetValue: 10 },

	// VELLUM EXPANSION (31)
	{ id: 'day_trades_20', name: 'Market Hustler', description: 'Complete 20 trades in a single day', icon: 'day_trades.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'trading', targetValue: 20 },
	{ id: 'net_profit_100k', name: 'Green Machine', description: 'Accumulate $100,000 in net trading profit', icon: 'net_profit.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'trading', targetValue: 100000 },
	{ id: 'net_profit_1m', name: 'Seven Figures', description: 'Accumulate $1,000,000 in net trading profit', icon: 'net_profit_million.svg', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'trading', targetValue: 1000000 },
	{ id: 'sell_100k', name: 'Cash Out', description: 'Sell $100,000+ of a single coin in one trade', icon: 'cash_out.svg', difficulty: 'hard', cashReward: 15000, gemReward: 50, category: 'trading' },
	{ id: 'hold_week', name: 'Patience', description: 'Hold a single coin for 7+ days without selling', icon: 'patience.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'trading' },
	{ id: 'portfolio_10m', name: 'Ten Figures', description: 'Reach $10,000,000 total portfolio value', icon: 'portfolio_10m.svg', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'wealth' },
	{ id: 'cash_1m', name: 'Liquid Gold', description: 'Hold $1,000,000 in pure cash', icon: 'liquid_gold.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'wealth' },
	{ id: 'mc_100k', name: 'Rising Star', description: 'Have a coin you created reach a $100,000 market cap', icon: 'rising_star.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'creation' },
	{ id: 'mc_1m', name: 'Market Captain', description: 'Have a coin you created reach a $1,000,000 market cap', icon: 'market_captain.svg', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'creation' },
	{ id: 'create_100', name: 'Coin Empire', description: 'Create 100 coins', icon: 'coin_empire.svg', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'creation', targetValue: 100 },
	{ id: 'arcade_10', name: 'Arcade Rookie', description: 'Play 10 arcade games', icon: 'arcade_rookie.svg', difficulty: 'easy', cashReward: 1500, gemReward: 8, category: 'arcade', targetValue: 10 },
	{ id: 'arcade_500', name: 'Arcade Fiend', description: 'Play 500 arcade games', icon: 'arcade_fiend.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'arcade', targetValue: 500 },
	{ id: 'arcade_1000', name: 'Full Tilt', description: 'Play 1,000 arcade games', icon: 'full_tilt.svg', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'arcade', targetValue: 1000 },
	{ id: 'arcade_10_streak', name: 'Untouchable', description: 'Win 10 arcade games in a row', icon: 'untouchable.svg', difficulty: 'legendary', cashReward: 60000, gemReward: 175, category: 'arcade', targetValue: 10 },
	{ id: 'arcade_1m_wagered', name: 'Whale Gaming', description: 'Wager $1,000,000 total across arcade games', icon: 'whale_gaming.svg', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'arcade', targetValue: 1000000 },
	{ id: 'arcade_wins_100k', name: 'House Edge Beater', description: 'Win $100,000 total in the arcade', icon: 'house_edge.svg', difficulty: 'medium', cashReward: 10000, gemReward: 30, category: 'arcade', targetValue: 100000 },
	{ id: 'streak_60', name: 'Unbreakable', description: 'Reach a 60-day login streak', icon: 'unbreakable.svg', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'streaks', targetValue: 60 },
	{ id: 'streak_100', name: 'Centurion', description: 'Reach a 100-day login streak', icon: 'centurion.svg', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'streaks', targetValue: 100 },
	{ id: 'prestige_2', name: 'Reborn', description: 'Reach Prestige II', icon: 'reborn.svg', difficulty: 'medium', cashReward: 10000, gemReward: 30, category: 'prestige', targetValue: 2 },
	{ id: 'win_100_bets', name: 'Diviner', description: 'Win 100 Hopium bets', icon: 'diviner.svg', difficulty: 'legendary', cashReward: 75000, gemReward: 200, category: 'hopium', targetValue: 100 },
	{ id: 'bet_100k_win', name: 'High Stakes Oracle', description: 'Win a single Hopium bet worth $100,000+', icon: 'oracle.svg', difficulty: 'legendary', cashReward: 100000, gemReward: 250, category: 'hopium' },
	{ id: 'create_50_questions', name: 'Inquisitor', description: 'Create 50 Hopium questions', icon: 'inquisitor.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'hopium', targetValue: 50 },
	{ id: 'comments_100', name: 'Chatterbox', description: 'Post 100 comments', icon: 'chatterbox.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'social', targetValue: 100 },
	{ id: 'comments_500', name: 'Megaphone', description: 'Post 500 comments', icon: 'megaphone.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'social', targetValue: 500 },
	{ id: 'transfer_10k_single', name: 'Big Send', description: 'Send $10,000 in a single transfer', icon: 'big_send.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'social' },
	{ id: 'received_500k', name: 'Loved', description: 'Receive $500,000 total in transfers', icon: 'loved.svg', difficulty: 'hard', cashReward: 25000, gemReward: 75, category: 'social', targetValue: 500000 },
	{ id: 'received_10_users', name: 'Popular', description: 'Receive transfers from 10 unique users', icon: 'popular.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'social', targetValue: 10 },
	{ id: 'own_25_colors', name: 'Colorist', description: 'Own 25 different name colors', icon: 'colorist.svg', difficulty: 'hard', cashReward: 20000, gemReward: 60, category: 'shop', targetValue: 25 },
	{ id: 'open_10_crates', name: 'Crate Junkie', description: 'Open 10 crates', icon: 'crate_junkie.svg', difficulty: 'easy', cashReward: 2500, gemReward: 10, category: 'shop', targetValue: 10 },
	{ id: 'account_1yr', name: 'Founding Member', description: 'Have an account older than 1 year', icon: 'founding_member.svg', difficulty: 'legendary', cashReward: 50000, gemReward: 150, category: 'special' },
	{ id: 'night_owl', name: 'Night Owl', description: 'Make a trade between 2:00 AM and 4:59 AM', icon: 'night_owl.svg', difficulty: 'medium', cashReward: 7500, gemReward: 25, category: 'trading' },
];

export const ACHIEVEMENTS_MAP: Record<string, AchievementDef> = Object.fromEntries(
	ACHIEVEMENTS.map((a) => [a.id, a])
);

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
	'trading', 'wealth', 'creation', 'arcade', 'streaks', 'prestige', 'hopium', 'social', 'shop', 'special', 'season',
];
