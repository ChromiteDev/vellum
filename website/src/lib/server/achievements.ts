import { db } from './db';
import {
	user,
	userAchievement,
	transaction,
	coin,
	userPortfolio,
	comment,
	predictionQuestion,
	predictionBet,
	userInventory,
	seasonParticipant,
	seasonTrophy
} from './db/schema';
import { eq, and, sql, count, gte, gt, ne } from 'drizzle-orm';
import { ACHIEVEMENTS_MAP, ACHIEVEMENTS } from '$lib/data/achievements';
import type { AchievementDef } from '$lib/data/achievements';
import { createNotification } from './notification';

export interface AchievementContext {
	tradeType?: 'BUY' | 'SELL';
	tradeAmount?: number; // total $ value of the trade
	coinChange24h?: number; // % change of the coin in 24h
	priceImpact?: number; // % price impact of the trade
	newBalance?: number; // balance after action
	newPrice?: number; // price after trade
	oldPrice?: number; // price before trade
	coinCreatedAt?: Date; // when the coin was created
	firstInvestmentAt?: Date; // when the user first invested in the coin

	// Arcade context
	arcadeWon?: boolean;
	arcadeWager?: number;
	slotsWinType?: string; // '3 OF A KIND' etc
	minesTilesRevealed?: number; // for mines cashout
	minesCount?: number; // number of mines in the game

	// Streak context
	newStreak?: number;
	totalRewardsClaimed?: number;

	// Prestige context
	newPrestigeLevel?: number;

	seasonJoined?: boolean;
	seasonGrowth?: number;
	seasonFinalRank?: number;

	// Crate context
	cratesOpened?: number;
}

export async function checkAndAwardAchievements(
	userId: number,
	categories: string[],
	context: AchievementContext = {}
): Promise<string[]> {
	try {
		const existing = await db
			.select({ achievementId: userAchievement.achievementId })
			.from(userAchievement)
			.where(eq(userAchievement.userId, userId));

		const owned = new Set(existing.map((e) => e.achievementId));
		const newlyAwarded: string[] = [];

		for (const category of categories) {
			const candidates = getCandidatesForCategory(category, owned);
			if (candidates.length === 0) continue;

			const earned = await checkCandidates(userId, candidates, context);
			for (const achievementId of earned) {
				const success = await awardAchievement(userId, achievementId);
				if (success) {
					newlyAwarded.push(achievementId);
					owned.add(achievementId);
				}
			}
		}

		return newlyAwarded;
	} catch (e) {
		console.error('Achievement check error:', e);
		return [];
	}
}

function getCandidatesForCategory(category: string, owned: Set<string>): AchievementDef[] {
	return Object.values(ACHIEVEMENTS_MAP).filter((a) => a.category === category && !owned.has(a.id));
}

async function checkCandidates(
	userId: number,
	candidates: AchievementDef[],
	ctx: AchievementContext
): Promise<string[]> {
	const earned: string[] = [];

	for (const a of candidates) {
		const unlocked = await checkAchievement(userId, a.id, ctx);
		if (unlocked) earned.push(a.id);
	}

	return earned;
}

async function checkAchievement(
	userId: number,
	achievementId: string,
	ctx: AchievementContext
): Promise<boolean> {
	switch (achievementId) {
		// TRADING
		case 'first_buy':
			return ctx.tradeType === 'BUY';

		case 'first_sell':
			return ctx.tradeType === 'SELL';

		case 'trades_50':
		case 'trades_500':
		case 'trades_5000': {
			const thresholds: Record<string, number> = {
				trades_50: 50,
				trades_500: 500,
				trades_5000: 5000
			};
			const [result] = await db
				.select({ cnt: count() })
				.from(transaction)
				.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
			return Number(result.cnt) >= thresholds[achievementId];
		}

		case 'dip_buyer':
			return ctx.tradeType === 'BUY' && (ctx.coinChange24h ?? 0) <= -50;

		case 'whale_trade':
			return (ctx.tradeAmount ?? 0) >= 100000;

		case 'hold_10_coins':
		case 'hold_25_coins': {
			const threshold = achievementId === 'hold_10_coins' ? 10 : 25;
			const [result] = await db
				.select({ cnt: count() })
				.from(userPortfolio)
				.where(and(eq(userPortfolio.userId, userId), gt(userPortfolio.quantity, '0')));
			return Number(result.cnt) >= threshold;
		}

		case 'yolo':
			return (ctx.tradeAmount ?? 0) >= 50000;

		case 'volume_10m': {
			const [result] = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
			return Number(result.total) >= 10000000;
		}

		case 'diamond_hands': {
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
			const result = await db.execute(sql`
				WITH running AS (
					SELECT t.coin_id, t.timestamp, t.type,
						SUM(CASE WHEN t.type = 'BUY' THEN t.quantity::numeric
								 WHEN t.type = 'SELL' THEN -t.quantity::numeric
								 ELSE 0 END)
						OVER (PARTITION BY t.coin_id ORDER BY t.timestamp) AS bal
					FROM "transaction" t
					WHERE t.user_id = ${userId}
					AND t.type IN ('BUY', 'SELL')
					AND t.coin_id IN (
						SELECT coin_id FROM "user_portfolio"
						WHERE user_id = ${userId} AND quantity::numeric > 0
					)
				),
				last_zero AS (
					SELECT coin_id, MAX(timestamp) AS zero_time
					FROM running WHERE bal <= 0
					GROUP BY coin_id
				),
				hold_start AS (
					SELECT r.coin_id, MIN(r.timestamp) AS start_time
					FROM running r
					LEFT JOIN last_zero lz ON r.coin_id = lz.coin_id
					WHERE r.type = 'BUY'
					AND r.timestamp > COALESCE(lz.zero_time, '1970-01-01'::timestamptz)
					GROUP BY r.coin_id
				)
				SELECT COUNT(*) AS cnt FROM hold_start
				WHERE start_time <= ${thirtyDaysAgo}
			`);
			return Number(result[0]?.cnt ?? 0) > 0;
		}

		case 'day_trades_20': {
			const [dayTrades] = await db
				.select({ cnt: count() })
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						sql`${transaction.type} IN ('BUY', 'SELL')`,
						sql`${transaction.timestamp} >= (NOW() AT TIME ZONE 'UTC')::DATE`
					)
				);
			return Number(dayTrades.cnt) >= 20;
		}

		case 'net_profit_100k':
		case 'net_profit_1m': {
			const [profitResult] = await db
				.select({
					net: sql<string>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'SELL' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE -CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) END), 0)`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
			const threshold = achievementId === 'net_profit_100k' ? 100000 : 1000000;
			return Number(profitResult.net) >= threshold;
		}

		case 'sell_100k':
			return ctx.tradeType === 'SELL' && (ctx.tradeAmount ?? 0) >= 100000;

		case 'hold_week': {
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
			const result = await db.execute(sql`
				WITH running AS (
					SELECT t.coin_id, t.timestamp, t.type,
						SUM(CASE WHEN t.type = 'BUY' THEN t.quantity::numeric
								 WHEN t.type = 'SELL' THEN -t.quantity::numeric
								 ELSE 0 END)
						OVER (PARTITION BY t.coin_id ORDER BY t.timestamp) AS bal
					FROM "transaction" t
					WHERE t.user_id = ${userId}
					AND t.type IN ('BUY', 'SELL')
					AND t.coin_id IN (
						SELECT coin_id FROM "user_portfolio"
						WHERE user_id = ${userId} AND quantity::numeric > 0
					)
				),
				last_zero AS (
					SELECT coin_id, MAX(timestamp) AS zero_time
					FROM running WHERE bal <= 0
					GROUP BY coin_id
				),
				hold_start AS (
					SELECT r.coin_id, MIN(r.timestamp) AS start_time
					FROM running r
					LEFT JOIN last_zero lz ON r.coin_id = lz.coin_id
					WHERE r.type = 'BUY'
					AND r.timestamp > COALESCE(lz.zero_time, '1970-01-01'::timestamptz)
					GROUP BY r.coin_id
				)
				SELECT COUNT(*) AS cnt FROM hold_start
				WHERE start_time <= ${sevenDaysAgo}
			`);
			return Number(result[0]?.cnt ?? 0) > 0;
		}

		case 'night_owl': {
			const [owlResult] = await db
				.select({ cnt: count() })
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						sql`${transaction.type} IN ('BUY', 'SELL')`,
						sql`EXTRACT(HOUR FROM ${transaction.timestamp} AT TIME ZONE 'UTC') BETWEEN 2 AND 4`
					)
				);
			return Number(owlResult.cnt) > 0;
		}

		case 'true_dedication': {
			// Check if user has bought at least $1000 worth of any single coin on each of the last 14 consecutive days with no sells ever on that coin
			const result = await db.execute(sql`
				WITH daily_buys AS (
					SELECT t.coin_id, DATE(t.timestamp AT TIME ZONE 'UTC') AS buy_date,
						SUM(CAST(t.total_base_currency_amount AS NUMERIC)) AS daily_amount
					FROM "transaction" t
					WHERE t.user_id = ${userId} AND t.type = 'BUY'
					GROUP BY t.coin_id, DATE(t.timestamp AT TIME ZONE 'UTC')
					HAVING SUM(CAST(t.total_base_currency_amount AS NUMERIC)) >= 1000
				),
				coins_with_sells AS (
					SELECT DISTINCT t.coin_id
					FROM "transaction" t
					WHERE t.user_id = ${userId} AND t.type = 'SELL'
				),
				eligible_coins AS (
					SELECT db.coin_id
					FROM daily_buys db
					LEFT JOIN coins_with_sells cs ON db.coin_id = cs.coin_id
					WHERE cs.coin_id IS NULL
					AND db.buy_date >= (NOW() AT TIME ZONE 'UTC')::DATE - INTERVAL '13 days'
					AND db.buy_date <= (NOW() AT TIME ZONE 'UTC')::DATE
					GROUP BY db.coin_id
					HAVING COUNT(DISTINCT db.buy_date) >= 14
				)
				SELECT COUNT(*) AS cnt FROM eligible_coins
			`);
			return Number(result[0]?.cnt ?? 0) > 0;
		}

		// WEALTH
		case 'portfolio_1k':
		case 'portfolio_100k':
		case 'portfolio_1m':
		case 'portfolio_10m':
		case 'portfolio_1b': {
			const thresholds: Record<string, number> = {
				portfolio_1k: 1000,
				portfolio_100k: 100000,
				portfolio_1m: 1000000,
				portfolio_10m: 10000000,
				portfolio_1b: 1000000000
			};
			const [userData] = await db
				.select({ balance: user.baseCurrencyBalance })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			const cash = Number(userData?.balance ?? 0);

			const [holdings] = await db
				.select({
					value: sql<string>`COALESCE(SUM(CAST(${userPortfolio.quantity} AS NUMERIC) * CAST(${coin.currentPrice} AS NUMERIC)), 0)`
				})
				.from(userPortfolio)
				.leftJoin(coin, eq(userPortfolio.coinId, coin.id))
				.where(eq(userPortfolio.userId, userId));

			const totalPortfolio = cash + Number(holdings?.value ?? 0);
			return totalPortfolio >= thresholds[achievementId];
		}

		case 'cash_1m': {
			const [cashUser] = await db
				.select({ balance: user.baseCurrencyBalance })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(cashUser?.balance ?? 0) >= 1000000;
		}

		case 'broke': {
			const [tradeCount] = await db
				.select({ cnt: count() })
				.from(transaction)
				.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
			if (Number(tradeCount.cnt) === 0) return false;
			let balance = ctx.newBalance;
			if (balance === undefined) {
				const [u] = await db
					.select({ balance: user.baseCurrencyBalance })
					.from(user)
					.where(eq(user.id, userId));
				balance = u ? Number(u.balance) : Infinity;
			}
			return balance < 1;
		}

		// COIN CREATION
		case 'create_coin':
		case 'create_5':
		case 'create_25': {
			const thresholds: Record<string, number> = { create_coin: 1, create_5: 5, create_25: 25 };
			const [result] = await db
				.select({ cnt: count() })
				.from(coin)
				.where(eq(coin.creatorId, userId));
			return Number(result.cnt) >= thresholds[achievementId];
		}

		case 'moon_100x': {
			const STARTING_PRICE = 0.000001;
			const targetPrice = STARTING_PRICE * 1000000;
			const [result] = await db
				.select({ cnt: count() })
				.from(coin)
				.where(and(eq(coin.creatorId, userId), gte(coin.currentPrice, targetPrice.toString())));
			return Number(result.cnt) > 0;
		}

		case 'rug_pull': {
			if (ctx.tradeType !== 'SELL' || !ctx.oldPrice || !ctx.newPrice) return false;
			const sellPriceDrop = (ctx.oldPrice - ctx.newPrice) / ctx.oldPrice;
			return sellPriceDrop >= 0.5;
		}

		case 'mc_100k':
		case 'mc_1m': {
			const threshold = achievementId === 'mc_100k' ? '100000.00' : '1000000.00';
			const [mcResult] = await db
				.select({ cnt: count() })
				.from(coin)
				.where(and(eq(coin.creatorId, userId), gte(coin.marketCap, threshold)));
			return Number(mcResult.cnt) > 0;
		}

		case 'create_100': {
			const [empireResult] = await db
				.select({ cnt: count() })
				.from(coin)
				.where(eq(coin.creatorId, userId));
			return Number(empireResult.cnt) >= 100;
		}

		// ARCADE
		case 'first_arcade':
			return true; // if checking arcade category, user just played

		case 'slots_jackpot':
			return ctx.slotsWinType === '3 OF A KIND';

		case 'mines_15':
			return (ctx.minesTilesRevealed ?? 0) >= 15;

		case 'mines_24':
			return ctx.arcadeWon === true && (ctx.minesCount ?? 0) >= 24;

		case 'mines_21':
			return ctx.arcadeWon === true && (ctx.minesTilesRevealed ?? 0) >= 22 && (ctx.minesCount ?? 0) === 3;

		case 'arcade_100': {
			const [userData] = await db
				.select({ total: user.totalArcadeGamesPlayed })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (userData?.total ?? 0) >= 100;
		}

		case 'arcade_wager_100k': {
			const [userData] = await db
				.select({ total: user.totalArcadeWagered })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(userData?.total ?? 0) >= 100000;
		}

		case 'arcade_losses_50k': {
			const [userData] = await db
				.select({ losses: user.arcadeLosses })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(userData?.losses ?? 0) >= 50000;
		}

		case 'win_streak_5': {
			const [userData] = await db
				.select({ best: user.arcadeBestWinStreak })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (userData?.best ?? 0) >= 5;
		}

		case 'arcade_wins_500k': {
			const [userData] = await db
				.select({ wins: user.arcadeWins })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(userData?.wins ?? 0) >= 500000;
		}

		case 'arcade_wins_1m': {
			const [userData] = await db
				.select({ wins: user.arcadeWins })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(userData?.wins ?? 0) >= 1000000;
		}

		case 'risk_biscuit':
			return ctx.arcadeWon === true && (ctx.arcadeWager ?? 0) >= 25000;

		case 'arcade_losses_1m': {
			const [userData] = await db
				.select({ losses: user.arcadeLosses })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(userData?.losses ?? 0) >= 1000000;
		}

		case 'arcade_10':
		case 'arcade_500':
		case 'arcade_1000': {
			const thresholds: Record<string, number> = {
				arcade_10: 10,
				arcade_500: 500,
				arcade_1000: 1000
			};
			const [gamesUser] = await db
				.select({ total: user.totalArcadeGamesPlayed })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (gamesUser?.total ?? 0) >= thresholds[achievementId];
		}

		case 'arcade_10_streak': {
			const [streakUser] = await db
				.select({ best: user.arcadeBestWinStreak })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (streakUser?.best ?? 0) >= 10;
		}

		case 'arcade_1m_wagered': {
			const [wagerUser] = await db
				.select({ total: user.totalArcadeWagered })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(wagerUser?.total ?? 0) >= 1000000;
		}

		case 'arcade_wins_100k': {
			const [winsUser] = await db
				.select({ wins: user.arcadeWins })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return Number(winsUser?.wins ?? 0) >= 100000;
		}

		// STREAKS
		case 'first_claim':
			return true; // if checking streaks category, user just claimed

		case 'streak_7':
			return (ctx.newStreak ?? 0) >= 7;
		case 'streak_14':
			return (ctx.newStreak ?? 0) >= 14;
		case 'streak_30':
			return (ctx.newStreak ?? 0) >= 30;
		case 'streak_60':
			return (ctx.newStreak ?? 0) >= 60;
		case 'streak_100':
			return (ctx.newStreak ?? 0) >= 100;

		case 'rewards_100k':
			return (ctx.totalRewardsClaimed ?? 0) >= 100000;
		// PRESTIGE
		case 'prestige_1':
			return (ctx.newPrestigeLevel ?? 0) >= 1;
		case 'prestige_2':
			return (ctx.newPrestigeLevel ?? 0) >= 2;
		case 'prestige_3':
			return (ctx.newPrestigeLevel ?? 0) >= 3;
		case 'prestige_5':
			return (ctx.newPrestigeLevel ?? 0) >= 5;

		// HOPIUM
		case 'first_bet':
			return true; // if checking hopium category from bet, user just bet

		case 'create_10_questions': {
			const [result] = await db
				.select({ cnt: count() })
				.from(predictionQuestion)
				.where(eq(predictionQuestion.creatorId, userId));
			return Number(result.cnt) >= 10;
		}

		case 'win_10_bets':
		case 'win_50_bets':
		case 'win_100_bets': {
			const threshold: Record<string, number> = { win_10_bets: 10, win_50_bets: 50, win_100_bets: 100 };
			const [result] = await db
				.select({ cnt: count() })
				.from(predictionBet)
				.where(and(eq(predictionBet.userId, userId), gt(predictionBet.actualWinnings, '0')));
			return Number(result.cnt) >= threshold[achievementId];
		}

		case 'bet_100k_win': {
			const [bigWin] = await db
				.select({ cnt: count() })
				.from(predictionBet)
				.where(and(eq(predictionBet.userId, userId), gte(predictionBet.actualWinnings, '100000')));
			return Number(bigWin.cnt) > 0;
		}

		case 'create_50_questions': {
			const [questionCount] = await db
				.select({ cnt: count() })
				.from(predictionQuestion)
				.where(eq(predictionQuestion.creatorId, userId));
			return Number(questionCount.cnt) >= 50;
		}

		// SOCIAL
		case 'comments_25': {
			const [result] = await db
				.select({ cnt: count() })
				.from(comment)
				.where(and(eq(comment.userId, userId), eq(comment.isDeleted, false)));
			return Number(result.cnt) >= 25;
		}

		case 'comments_50': {
			const [result] = await db
				.select({ cnt: count() })
				.from(comment)
				.where(and(eq(comment.userId, userId), eq(comment.isDeleted, false)));
			return Number(result.cnt) >= 50;
		}

		case 'comments_100':
		case 'comments_500': {
			const [result] = await db
				.select({ cnt: count() })
				.from(comment)
				.where(and(eq(comment.userId, userId), eq(comment.isDeleted, false)));
			const target = achievementId === 'comments_100' ? 100 : 500;
			return Number(result.cnt) >= target;
		}

		case 'transfer_10k_single': {
			const [result] = await db
				.select({ cnt: count() })
				.from(transaction)
				.where(
					and(
						eq(transaction.userId, userId),
						eq(transaction.type, 'TRANSFER_OUT'),
						gte(transaction.totalBaseCurrencyAmount, '10000')
					)
				);
			return Number(result.cnt) > 0;
		}

		case 'received_500k': {
			const [result] = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_IN')));
			return Number(result.total) >= 500000;
		}

		case 'received_10_users': {
			const [result] = await db
				.select({ cnt: sql<string>`COUNT(DISTINCT ${transaction.senderUserId})` })
				.from(transaction)
				.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_IN')));
			return Number(result.cnt) >= 10;
		}

		case 'top_rugpuller': {
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const topRugpullers = await db
				.select({
					userId: transaction.userId,
					netExtraction: sql<string>`
						SUM(CASE WHEN ${transaction.type} = 'SELL' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE 0 END) -
						SUM(CASE WHEN ${transaction.type} = 'BUY' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE 0 END)
					`
				})
				.from(transaction)
				.where(
					and(gte(transaction.timestamp, oneDayAgo), sql`${transaction.type} IN ('BUY', 'SELL')`)
				)
				.groupBy(transaction.userId)
				.orderBy(
					sql`SUM(CASE WHEN ${transaction.type} = 'SELL' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE 0 END) - SUM(CASE WHEN ${transaction.type} = 'BUY' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE 0 END) DESC`
				)
				.limit(1);

			if (topRugpullers.length === 0) return false;
			return topRugpullers[0].userId === userId && Number(topRugpullers[0].netExtraction) > 0;
		}

		case 'transfers_10_users': {
			const [result] = await db
				.select({
					cnt: sql<string>`COUNT(DISTINCT ${transaction.recipientUserId})`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_OUT')));
			return Number(result.cnt) >= 10;
		}

		case 'transfer_500k': {
			const [result] = await db
				.select({
					total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_OUT')));
			return Number(result.total) >= 500000;
		}

		case 'received_from_15': {
			const [result] = await db
				.select({
					cnt: sql<string>`COUNT(DISTINCT ${transaction.senderUserId})`
				})
				.from(transaction)
				.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_IN')));
			return Number(result.cnt) >= 15;
		}

		case 'update_bio':
			return true; // triggered when bio is updated

		// SHOP
		case 'own_10_colors': {
			const [result] = await db
				.select({ cnt: count() })
				.from(userInventory)
				.where(and(eq(userInventory.userId, userId), eq(userInventory.itemType, 'namecolor')));
			return Number(result.cnt) >= 10;
		}

		case 'open_50_crates': {
			const [userData] = await db
				.select({ crates: user.cratesOpened })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (userData?.crates ?? 0) >= 50;
		}

		case 'own_25_colors': {
			const [result] = await db
				.select({ cnt: count() })
				.from(userInventory)
				.where(and(eq(userInventory.userId, userId), eq(userInventory.itemType, 'namecolor')));
			return Number(result.cnt) >= 25;
		}

		case 'open_10_crates': {
			const [userData] = await db
				.select({ crates: user.cratesOpened })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			return (userData?.crates ?? 0) >= 10;
		}

		// SPECIAL
		case 'all_in': {
			if (ctx.tradeType !== 'BUY' || !ctx.tradeAmount || ctx.newBalance === undefined) return false;
			const preTradeBalance = ctx.newBalance + ctx.tradeAmount;
			return preTradeBalance > 0 && ctx.tradeAmount / preTradeBalance >= 0.95;
		}

		case 'account_6mo': {
			const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
			const [userData] = await db
				.select({ createdAt: user.createdAt })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			if (!userData) return false;
			return userData.createdAt <= sixMonthsAgo;
		}

		case 'account_1yr': {
			const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
			const [userData] = await db
				.select({ createdAt: user.createdAt })
				.from(user)
				.where(eq(user.id, userId))
				.limit(1);
			if (!userData) return false;
			return userData.createdAt <= yearAgo;
		}

		case 'season_entry':
			return ctx.seasonJoined === true;

		case 'season_double':
			return (ctx.seasonGrowth ?? 0) >= 2;
		case 'season_10x':
			return (ctx.seasonGrowth ?? 0) >= 10;
		case 'season_100x':
			return (ctx.seasonGrowth ?? 0) >= 100;

		case 'season_podium':
			return (ctx.seasonFinalRank ?? Infinity) <= 3;
		case 'season_champion':
			return ctx.seasonFinalRank === 1;

		case 'season_underdog':
			return (ctx.seasonFinalRank ?? Infinity) <= 10;

		case 'season_dynasty': {
			const [result] = await db
				.select({ wins: count() })
				.from(seasonTrophy)
				.where(and(eq(seasonTrophy.userId, userId), eq(seasonTrophy.rank, 1)));
			return (result?.wins ?? 0) >= 2;
		}

		case 'season_regular':
		case 'season_veteran': {
			const [result] = await db
				.select({ seasons: count() })
				.from(seasonParticipant)
				.where(eq(seasonParticipant.userId, userId));
			const target = ACHIEVEMENTS_MAP[achievementId]?.targetValue ?? 0;
			return (result?.seasons ?? 0) >= target;
		}

		default:
			return false;
	}
}

async function awardAchievement(userId: number, achievementId: string): Promise<boolean> {
	const def = ACHIEVEMENTS_MAP[achievementId];
	if (!def) return false;

	try {
		const result = await db
			.insert(userAchievement)
			.values({ userId, achievementId, claimed: false })
			.onConflictDoNothing({ target: [userAchievement.userId, userAchievement.achievementId] })
			.returning({ id: userAchievement.id });

		if (result.length === 0) return false;

		await createNotification(
			userId.toString(),
			'SYSTEM',
			`🏆 Achievement Unlocked: ${def.name}`,
			`${def.description}`,
			'/achievements',
			{ achievementIcon: def.icon }
		);

		return true;
	} catch (e) {
		console.error(`Failed to award achievement ${achievementId} to user ${userId}:`, e);
		return false;
	}
}
export async function claimAchievement(
	userId: number,
	achievementId: string
): Promise<{ cashReward: number; gemReward: number } | null> {
	const def = ACHIEVEMENTS_MAP[achievementId];
	if (!def) return null;

	try {
		return await db.transaction(async (tx) => {
			const result = await tx
				.update(userAchievement)
				.set({ claimed: true })
				.where(
					and(
						eq(userAchievement.userId, userId),
						eq(userAchievement.achievementId, achievementId),
						eq(userAchievement.claimed, false)
					)
				)
				.returning({ id: userAchievement.id });

			if (result.length === 0) return null;

			await tx
				.update(user)
				.set({
					baseCurrencyBalance: sql`${user.baseCurrencyBalance} + ${def.cashReward}`,
					gems: sql`${user.gems} + ${def.gemReward}`,
					updatedAt: sql`NOW()`
				})
				.where(eq(user.id, userId));

			return { cashReward: def.cashReward, gemReward: def.gemReward };
		});
	} catch (e) {
		console.error(`Failed to claim achievement ${achievementId} for user ${userId}:`, e);
		return null;
	}
}

export async function claimAllAchievements(
	userId: number
): Promise<{ cashReward: number; gemReward: number; count: number }> {
	try {
		return await db.transaction(async (tx) => {
			const unclaimed = await tx
				.select({ achievementId: userAchievement.achievementId })
				.from(userAchievement)
				.where(and(eq(userAchievement.userId, userId), eq(userAchievement.claimed, false)))
				.for('update');

			if (unclaimed.length === 0) return { cashReward: 0, gemReward: 0, count: 0 };

			let totalCash = 0;
			let totalGems = 0;

			for (const row of unclaimed) {
				const def = ACHIEVEMENTS_MAP[row.achievementId];
				if (def) {
					totalCash += def.cashReward;
					totalGems += def.gemReward;
				}
			}

			await tx
				.update(userAchievement)
				.set({ claimed: true })
				.where(and(eq(userAchievement.userId, userId), eq(userAchievement.claimed, false)));

			await tx
				.update(user)
				.set({
					baseCurrencyBalance: sql`${user.baseCurrencyBalance} + ${totalCash}`,
					gems: sql`${user.gems} + ${totalGems}`,
					updatedAt: sql`NOW()`
				})
				.where(eq(user.id, userId));

			return { cashReward: totalCash, gemReward: totalGems, count: unclaimed.length };
		});
	} catch (e) {
		console.error(`Failed to claim all achievements for user ${userId}:`, e);
		return { cashReward: 0, gemReward: 0, count: 0 };
	}
}

export async function getAchievementProgress(userId: number): Promise<Record<string, number>> {
	const progress: Record<string, number> = {};

	try {
		const [userData] = await db
			.select({
				totalArcadeGamesPlayed: user.totalArcadeGamesPlayed,
				totalArcadeWagered: user.totalArcadeWagered,
				arcadeLosses: user.arcadeLosses,
				arcadeWins: user.arcadeWins,
				arcadeBestWinStreak: user.arcadeBestWinStreak,
				loginStreak: user.loginStreak,
				totalRewardsClaimed: user.totalRewardsClaimed,
				prestigeLevel: user.prestigeLevel,
				cratesOpened: user.cratesOpened
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (userData) {
			progress['arcade_100'] = userData.totalArcadeGamesPlayed ?? 0;
			progress['arcade_wager_100k'] = Number(userData.totalArcadeWagered ?? 0);
			progress['arcade_losses_50k'] = Number(userData.arcadeLosses ?? 0);
			progress['arcade_wins_500k'] = Number(userData.arcadeWins ?? 0);
			progress['arcade_wins_1m'] = Number(userData.arcadeWins ?? 0);
			progress['arcade_losses_1m'] = Number(userData.arcadeLosses ?? 0);
			progress['win_streak_5'] = userData.arcadeBestWinStreak ?? 0;
			progress['streak_7'] = userData.loginStreak ?? 0;
			progress['streak_14'] = userData.loginStreak ?? 0;
			progress['streak_30'] = userData.loginStreak ?? 0;
			progress['rewards_100k'] = Number(userData.totalRewardsClaimed ?? 0);
			progress['prestige_1'] = userData.prestigeLevel ?? 0;
			progress['prestige_3'] = userData.prestigeLevel ?? 0;
			progress['prestige_5'] = userData.prestigeLevel ?? 0;
			progress['open_50_crates'] = userData.cratesOpened ?? 0;
		}

		const [tradeCount] = await db
			.select({ cnt: count() })
			.from(transaction)
			.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
		const trades = Number(tradeCount?.cnt ?? 0);
		progress['trades_50'] = trades;
		progress['trades_500'] = trades;
		progress['trades_5000'] = trades;

		const [volumeResult] = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
			})
			.from(transaction)
			.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
		progress['volume_10m'] = Number(volumeResult?.total ?? 0);

		const [holdingsCount] = await db
			.select({ cnt: count() })
			.from(userPortfolio)
			.where(and(eq(userPortfolio.userId, userId), gt(userPortfolio.quantity, '0')));
		const holdings = Number(holdingsCount?.cnt ?? 0);
		progress['hold_10_coins'] = holdings;
		progress['hold_25_coins'] = holdings;

		const [coinCount] = await db
			.select({ cnt: count() })
			.from(coin)
			.where(eq(coin.creatorId, userId));
		const coins = Number(coinCount?.cnt ?? 0);
		progress['create_5'] = coins;
		progress['create_25'] = coins;

		const [questionCount] = await db
			.select({ cnt: count() })
			.from(predictionQuestion)
			.where(eq(predictionQuestion.creatorId, userId));
		progress['create_10_questions'] = Number(questionCount?.cnt ?? 0);

		const [betWins] = await db
			.select({ cnt: count() })
			.from(predictionBet)
			.where(and(eq(predictionBet.userId, userId), gt(predictionBet.actualWinnings, '0')));
		const betsWon = Number(betWins?.cnt ?? 0);
		progress['win_10_bets'] = betsWon;
		progress['win_50_bets'] = betsWon;

		const [commentCount] = await db
			.select({ cnt: count() })
			.from(comment)
			.where(and(eq(comment.userId, userId), eq(comment.isDeleted, false)));
		progress['comments_25'] = Number(commentCount?.cnt ?? 0);
		progress['comments_50'] = Number(commentCount?.cnt ?? 0);

		const [transferUsers] = await db
			.select({ cnt: sql<string>`COUNT(DISTINCT ${transaction.recipientUserId})` })
			.from(transaction)
			.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_OUT')));
		progress['transfers_10_users'] = Number(transferUsers?.cnt ?? 0);

		const [transferTotal] = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
			})
			.from(transaction)
			.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_OUT')));
		progress['transfer_500k'] = Number(transferTotal?.total ?? 0);

		const [receivedFromUsers] = await db
			.select({ cnt: sql<string>`COUNT(DISTINCT ${transaction.senderUserId})` })
			.from(transaction)
			.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_IN')));
		progress['received_from_15'] = Number(receivedFromUsers?.cnt ?? 0);

		const [colorCount] = await db
			.select({ cnt: count() })
			.from(userInventory)
			.where(and(eq(userInventory.userId, userId), eq(userInventory.itemType, 'namecolor')));
		progress['own_10_colors'] = Number(colorCount?.cnt ?? 0);

		const dedicationResult = await db.execute(sql`
			WITH daily_buys AS (
				SELECT t.coin_id, DATE(t.timestamp AT TIME ZONE 'UTC') AS buy_date
				FROM "transaction" t
				WHERE t.user_id = ${userId} AND t.type = 'BUY'
				GROUP BY t.coin_id, DATE(t.timestamp AT TIME ZONE 'UTC')
				HAVING SUM(CAST(t.total_base_currency_amount AS NUMERIC)) >= 1000
			),
			coins_with_sells AS (
				SELECT DISTINCT t.coin_id
				FROM "transaction" t
				WHERE t.user_id = ${userId} AND t.type = 'SELL'
			),
			eligible_buys AS (
				SELECT db.coin_id, db.buy_date
				FROM daily_buys db
				LEFT JOIN coins_with_sells cs ON db.coin_id = cs.coin_id
				WHERE cs.coin_id IS NULL
				AND db.buy_date >= (NOW() AT TIME ZONE 'UTC')::DATE - INTERVAL '13 days'
				AND db.buy_date <= (NOW() AT TIME ZONE 'UTC')::DATE
			)
			SELECT COALESCE(MAX(day_count), 0) AS best
			FROM (
				SELECT coin_id, COUNT(DISTINCT buy_date) AS day_count
				FROM eligible_buys
				GROUP BY coin_id
			) sub
		`);
		progress['true_dedication'] = Number((dedicationResult as any)[0]?.best ?? 0);

		const [cashRow] = await db
			.select({ balance: user.baseCurrencyBalance })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);
		progress['cash_1m'] = Number(cashRow?.balance ?? 0);

		const [todayTrades] = await db
			.select({ cnt: count() })
			.from(transaction)
			.where(
				and(
					eq(transaction.userId, userId),
					sql`${transaction.type} IN ('BUY', 'SELL')`,
					sql`${transaction.timestamp} >= (NOW() AT TIME ZONE 'UTC')::DATE`
				)
			);
		progress['day_trades_20'] = Number(todayTrades?.cnt ?? 0);

		const [netProfit] = await db
			.select({
				net: sql<string>`COALESCE(SUM(CASE WHEN ${transaction.type} = 'SELL' THEN CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) ELSE -CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC) END), 0)`
			})
			.from(transaction)
			.where(and(eq(transaction.userId, userId), sql`${transaction.type} IN ('BUY', 'SELL')`));
		const net = Number(netProfit?.net ?? 0);
		progress['net_profit_100k'] = net;
		progress['net_profit_1m'] = net;

		const [mc100k] = await db
			.select({ cnt: count() })
			.from(coin)
			.where(and(eq(coin.creatorId, userId), gte(coin.marketCap, '100000.00')));
		const [mc1m] = await db
			.select({ cnt: count() })
			.from(coin)
			.where(and(eq(coin.creatorId, userId), gte(coin.marketCap, '1000000.00')));
		progress['mc_100k'] = Number(mc100k?.cnt ?? 0);
		progress['mc_1m'] = Number(mc1m?.cnt ?? 0);
		progress['create_100'] = coins;

		progress['arcade_10'] = userData?.totalArcadeGamesPlayed ?? 0;
		progress['arcade_500'] = userData?.totalArcadeGamesPlayed ?? 0;
		progress['arcade_1000'] = userData?.totalArcadeGamesPlayed ?? 0;
		progress['arcade_10_streak'] = userData?.arcadeBestWinStreak ?? 0;
		progress['arcade_1m_wagered'] = Number(userData?.totalArcadeWagered ?? 0);
		progress['arcade_wins_100k'] = Number(userData?.arcadeWins ?? 0);
		progress['streak_60'] = userData?.loginStreak ?? 0;
		progress['streak_100'] = userData?.loginStreak ?? 0;
		progress['prestige_2'] = userData?.prestigeLevel ?? 0;
		progress['open_10_crates'] = userData?.cratesOpened ?? 0;

		progress['win_100_bets'] = betsWon;
		progress['create_50_questions'] = Number(questionCount?.cnt ?? 0);
		progress['comments_100'] = Number(commentCount?.cnt ?? 0);
		progress['comments_500'] = Number(commentCount?.cnt ?? 0);
		progress['own_25_colors'] = Number(colorCount?.cnt ?? 0);

		const [bigSendCount] = await db
			.select({ cnt: count() })
			.from(transaction)
			.where(
				and(
					eq(transaction.userId, userId),
					eq(transaction.type, 'TRANSFER_OUT'),
					gte(transaction.totalBaseCurrencyAmount, '10000')
				)
			);
		progress['transfer_10k_single'] = Number(bigSendCount?.cnt ?? 0);

		const [receivedTotal] = await db
			.select({
				total: sql<string>`COALESCE(SUM(CAST(${transaction.totalBaseCurrencyAmount} AS NUMERIC)), 0)`
			})
			.from(transaction)
			.where(and(eq(transaction.userId, userId), eq(transaction.type, 'TRANSFER_IN')));
		progress['received_500k'] = Number(receivedTotal?.total ?? 0);

		const [bigBetCount] = await db
			.select({ cnt: count() })
			.from(predictionBet)
			.where(and(eq(predictionBet.userId, userId), gte(predictionBet.actualWinnings, '100000')));
		progress['bet_100k_win'] = Number(bigBetCount?.cnt ?? 0);
	} catch (e) {
		console.error('Achievement progress error:', e);
	}

	return progress;
}
