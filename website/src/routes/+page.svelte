<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { getTimeBasedGreeting, formatValue, formatQuantity } from '$lib/utils';
	import { USER_DATA } from '$lib/stores/user-data';
	import { PORTFOLIO_SUMMARY, fetchPortfolioSummary } from '$lib/stores/portfolio-data';
	import { GEMS_BALANCE, fetchGemsBalance } from '$lib/stores/gems';
	import SignInConfirmDialog from '$lib/components/self/SignInConfirmDialog.svelte';
	import CoinIcon from '$lib/components/self/CoinIcon.svelte';
	import GameArt from '$lib/components/self/GameArt.svelte';
	import SeasonCard from '$lib/components/self/SeasonCard.svelte';
	import SEO from '$lib/components/self/SEO.svelte';
	import { GAMES } from '$lib/data/games';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import { TrendingUp, Gamepad2, Award, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-svelte';

	let shouldSignIn = $state(false);
	let coins = $state<any[]>([]);
	let loading = $state(true);
	let seasonData = $state<any>(null);
	let achievements = $state<any[]>([]);
	let unlockedCount = $state(0);

	let marketTab = $state<'top' | 'gainers' | 'losers'>('top');

	let marketList = $derived.by(() => {
		if (marketTab === 'gainers') return [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 6);
		if (marketTab === 'losers') return [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 6);
		return coins.slice(0, 6);
	});

	let featuredGames = $derived(
		[...GAMES.filter((g) => g.featured || g.trending), ...GAMES.filter((g) => !g.featured && !g.trending)].slice(0, 3)
	);

	let nextUp = $derived.by(() => {
		const locked = achievements.filter((a) => !a.unlocked);
		const inProgress = locked.filter((a) => a.targetValue && a.progress != null && a.progress > 0);
		const pool = inProgress.length > 0 ? inProgress : locked;
		return [...pool]
			.sort((a, b) => {
				const pa = a.targetValue ? a.progress / a.targetValue : 0;
				const pb = b.targetValue ? b.progress / b.targetValue : 0;
				return pb - pa;
			})
			.slice(0, 3);
	});

	onMount(async () => {
		try {
			const [coinResult, season, achievementsResult] = await Promise.all([
				fetch('/api/coins/top').then((r) => (r.ok ? r.json() : { coins: [] })),
				fetch('/api/season').then((r) => (r.ok ? r.json() : null)).catch(() => null),
				$USER_DATA
					? fetch('/api/achievements').then((r) => (r.ok ? r.json() : null)).catch(() => null)
					: Promise.resolve(null)
			]);

			coins = coinResult.coins ?? [];
			seasonData = season;

			if (achievementsResult) {
				achievements = achievementsResult.achievements ?? [];
				unlockedCount = achievementsResult.unlockedCount ?? 0;
			}

			if ($USER_DATA) {
				fetchPortfolioSummary();
				fetchGemsBalance();
			}
		} catch (e) {
			console.error('Failed to load dashboard:', e);
			toast.error('Failed to load dashboard');
		} finally {
			loading = false;
		}
	});
</script>

<SEO
	title="Vellum"
	description="Vellum is a realistic crypto market with live liquidity pools, coin launches, and a full arcade. Trade, launch coins, and climb the leaderboard."
	keywords="crypto market, trading platform, paper trading, crypto market game, liquidity pools, vellum"
/>

<SignInConfirmDialog bind:open={shouldSignIn} />

<div class="container mx-auto max-w-7xl p-4 md:p-6">
	<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="truncate text-2xl font-bold tracking-tight md:text-3xl">
				{$USER_DATA ? getTimeBasedGreeting($USER_DATA?.name) : 'Welcome to Vellum'}
			</h1>
			<p class="text-muted-foreground mt-1 text-sm md:text-base">
				{#if $USER_DATA}
					Your market at a glance.
				{:else}
					The market never sleeps. <button
						class="text-primary underline underline-offset-2 hover:cursor-pointer"
						onclick={() => (shouldSignIn = true)}>Sign in</button
					>
					to start trading.
				{/if}
			</p>
		</div>
		{#if $USER_DATA}
			<Button onclick={() => goto('/coin/create')} class="shrink-0">
				<Sparkles class="h-4 w-4" />
				Create coin
			</Button>
		{/if}
	</header>

	{#if loading}
		<div class="space-y-6">
			<div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{#each Array(4) as _}
					<Card.Root>
						<Card.Content class="space-y-2 py-4">
							<Skeleton class="h-3 w-16" />
							<Skeleton class="h-7 w-24" />
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
			<div class="grid gap-6 lg:grid-cols-3">
				<div class="space-y-6 lg:col-span-2">
					<Card.Root><Card.Content class="h-72"><Skeleton class="h-full w-full" /></Card.Content></Card.Root>
					<Card.Root><Card.Content class="h-48"><Skeleton class="h-full w-full" /></Card.Content></Card.Root>
				</div>
				<div class="space-y-6">
					<Card.Root><Card.Content class="h-56"><Skeleton class="h-full w-full" /></Card.Content></Card.Root>
					<Card.Root><Card.Content class="h-64"><Skeleton class="h-full w-full" /></Card.Content></Card.Root>
				</div>
			</div>
		</div>
	{:else}
		{#if $USER_DATA}
			<section class="animate-vellum-rise mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Card.Root class="min-w-0">
					<Card.Content class="py-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Portfolio</div>
						<div class="text-stat mt-1 font-bold break-all leading-tight tabular-nums">{formatValue($PORTFOLIO_SUMMARY?.totalValue ?? 0)}</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0">
					<Card.Content class="py-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Cash</div>
						<div class="text-stat mt-1 font-bold break-all leading-tight tabular-nums text-success">
							{formatValue($PORTFOLIO_SUMMARY?.baseCurrencyBalance ?? 0)}
						</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0">
					<Card.Content class="py-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Gems</div>
						<div class="text-stat mt-1 font-bold break-all leading-tight tabular-nums">{formatQuantity($GEMS_BALANCE ?? 0)}</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0">
					<Card.Content class="py-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Achievements</div>
						<div class="text-stat mt-1 font-bold leading-tight tabular-nums">{unlockedCount}<span class="text-muted-foreground text-sm font-medium"> / 100</span></div>
					</Card.Content>
				</Card.Root>
			</section>
		{:else}
			<section class="mb-6 overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6 md:p-8">
				<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div class="max-w-xl">
						<h2 class="text-xl font-bold tracking-tight md:text-2xl">A living market, built for traders.</h2>
						<p class="text-muted-foreground mt-2 text-sm md:text-base">
							Launch coins, trade liquidity pools, play the arcade, and climb the leaderboard. Everything you
							earn is yours to grow.
						</p>
					</div>
					<Button size="lg" onclick={() => (shouldSignIn = true)} class="shrink-0">
						Get started
						<ArrowRight class="h-4 w-4" />
					</Button>
				</div>
			</section>
		{/if}

		<div class="animate-vellum-rise grid gap-6 lg:grid-cols-3" style="animation-delay: 70ms">
			<div class="space-y-6 lg:col-span-2">
				<Card.Root>
					<Card.Header class="flex-row flex-wrap items-center justify-between gap-3 pb-3">
						<Card.Title class="flex items-center gap-2">
							<TrendingUp class="text-primary h-4 w-4" />
							Market
						</Card.Title>
						<div class="flex rounded-lg border p-0.5">
							{#each [
								{ key: 'top', label: 'Top' },
								{ key: 'gainers', label: 'Gainers' },
								{ key: 'losers', label: 'Losers' }
							] as tab (tab.key)}
								<button
									type="button"
									onclick={() => (marketTab = tab.key as typeof marketTab)}
									class="rounded-md px-3 py-1 text-xs font-medium transition-colors {marketTab === tab.key
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									{tab.label}
								</button>
							{/each}
						</div>
					</Card.Header>
					<Card.Content class="pt-0">
						{#if marketList.length === 0}
							<div class="text-muted-foreground flex h-48 items-center justify-center text-sm">
								No coins yet. Be the first to launch one.
							</div>
						{:else}
							<div class="divide-y">
								{#each marketList as coin (coin.symbol)}
									<a
										href={`/coin/${coin.symbol}`}
										class="hover:bg-muted/50 flex items-center gap-3 px-2 py-2.5 transition-colors"
									>
										<CoinIcon icon={coin.icon} symbol={coin.symbol} name={coin.name} size={8} class="shrink-0" />
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm font-medium">{coin.name}</div>
											<div class="text-muted-foreground font-mono text-xs">*{coin.symbol}</div>
										</div>
										<div class="hidden text-right sm:block">
											<div class="text-sm font-semibold tabular-nums">{formatValue(coin.price)}</div>
											<div class="text-muted-foreground text-xs">price</div>
										</div>
										<div class="hidden text-right md:block">
											<div class="text-sm font-medium tabular-nums">{formatValue(coin.marketCap)}</div>
											<div class="text-muted-foreground text-xs">market cap</div>
										</div>
										<Badge variant={coin.change24h >= 0 ? 'success' : 'destructive'} class="shrink-0 tabular-nums">
											{coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
										</Badge>
									</a>
								{/each}
							</div>
						{/if}
					</Card.Content>
					<Card.Footer class="border-t pt-3">
						<a
							href="/market"
							class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
						>
							View full market
							<ArrowUpRight class="h-4 w-4" />
						</a>
					</Card.Footer>
				</Card.Root>

				<Card.Root>
					<Card.Header class="flex-row flex-wrap items-center justify-between gap-3 pb-3">
						<Card.Title class="flex items-center gap-2">
							<Gamepad2 class="text-primary h-4 w-4" />
							Arcade
						</Card.Title>
						<a
							href="/arcade"
							class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
						>
							All games
							<ArrowUpRight class="h-4 w-4" />
						</a>
					</Card.Header>
					<Card.Content class="pt-0">
						<div class="grid gap-3 sm:grid-cols-3">
							{#each featuredGames as game (game.key)}
								<a
									href="/arcade"
									class="group hover:bg-muted/50 rounded-xl border p-4 text-center transition-colors"
								>
									<div class="mx-auto h-20 w-20">
										<GameArt game={game.key} class="h-full w-full transition-transform duration-200 group-hover:scale-105" />
									</div>
									<div class="mt-3 truncate text-sm font-semibold">{game.name}</div>
									<div class="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{game.tagline}</div>
								</a>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			</div>

			<div class="space-y-6">
				{#if seasonData?.season}
					<SeasonCard data={seasonData} />
				{/if}

			</div>
		</div>

		{#if $USER_DATA && achievements.length > 0}
			<section class="animate-vellum-rise mt-6" style="animation-delay: 140ms">
				<Card.Root>
					<Card.Header class="flex-row flex-wrap items-center justify-between gap-3 pb-3">
						<Card.Title class="flex items-center gap-2">
							<Award class="text-primary h-4 w-4" />
							Achievements
						</Card.Title>
						<a
							href="/achievements"
							class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm font-medium transition-colors"
						>
							All achievements
							<ArrowUpRight class="h-4 w-4" />
						</a>
					</Card.Header>
					<Card.Content class="pt-0">
						<div class="mb-4">
							<div class="text-muted-foreground mb-1.5 flex items-center justify-between text-sm">
								<span>{unlockedCount} of 100 unlocked</span>
								<span class="font-medium tabular-nums">{Math.round((unlockedCount / 100) * 100)}%</span>
							</div>
							<div class="bg-muted h-1.5 w-full overflow-hidden rounded-full">
								<div
									class="bg-primary h-full rounded-full transition-all duration-500"
									style="width: {Math.max(2, (unlockedCount / 100) * 100)}%"
								></div>
							</div>
						</div>
						<div class="grid gap-3 sm:grid-cols-3">
							{#each nextUp as achievement (achievement.id)}
								<a href="/achievements" class="hover:bg-muted/50 rounded-xl border p-3 transition-colors">
									<div class="flex items-center gap-2.5">
										<img
											src={`/achievements/${achievement.icon}`}
											alt={achievement.name}
											class="h-9 w-9 shrink-0 rounded-lg bg-muted p-1"
										/>
										<div class="min-w-0 flex-1">
											<div class="truncate text-sm font-semibold">{achievement.name}</div>
											<div class="text-muted-foreground line-clamp-1 text-xs">{achievement.description}</div>
										</div>
									</div>
									{#if achievement.progress != null && achievement.targetValue}
										<div class="bg-muted mt-3 h-1 w-full overflow-hidden rounded-full">
											<div
												class="bg-primary h-full rounded-full"
												style="width: {Math.min(100, (achievement.progress / achievement.targetValue) * 100)}%"
											></div>
										</div>
									{/if}
								</a>
							{/each}
						</div>
					</Card.Content>
				</Card.Root>
			</section>
		{/if}
	{/if}
</div>
