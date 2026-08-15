<script lang="ts">
	import Coinflip from '$lib/components/self/games/Coinflip.svelte';
	import Slots from '$lib/components/self/games/Slots.svelte';
	import Mines from '$lib/components/self/games/Mines.svelte';
	import { USER_DATA } from '$lib/stores/user-data';
	import { PORTFOLIO_SUMMARY, fetchPortfolioSummary } from '$lib/stores/portfolio-data';
	import SignInConfirmDialog from '$lib/components/self/SignInConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import SEO from '$lib/components/self/SEO.svelte';
	import Dice from '$lib/components/self/games/Dice.svelte';
	import Tower from '$lib/components/self/games/Tower.svelte';
	import Wheel from '$lib/components/self/games/Wheel.svelte';
	import GameArt, { type GameKey } from '$lib/components/self/GameArt.svelte';
	import { GAMES, type GameMeta } from '$lib/data/games';
	import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '$lib/components/ui/card';
	import { arcadeActivityStore } from '$lib/stores/websocket';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import UserProfilePreview from '$lib/components/self/UserProfilePreview.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Clock01Icon, PiggyBankIcon } from '@hugeicons/core-free-icons';
	import { formatValue, formatRelativeTime, getPublicUrl } from '$lib/utils';

	let shouldSignIn = $state(false);
	let balance = $state(0);
	let activeGame = $state<GameKey | null>(null);
	let searchQuery = $state('');
	let categoryFilter = $state<'all' | 'luck' | 'skill'>('all');

	const filteredGames = $derived(
		GAMES.filter((game) => {
			const matchesCategory = categoryFilter === 'all' || game.category === categoryFilter;
			const matchesSearch = game.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	const activeMeta = $derived(GAMES.find((g) => g.key === activeGame) ?? null);

	// Filter activities to only show bets >= $1000
	const filteredActivities = $derived(
		$arcadeActivityStore.filter((activity) => activity.amount >= 1000).slice(0, 10)
	);

	function handleBalanceUpdate(newBalance: number) {
		balance = newBalance;

		if ($PORTFOLIO_SUMMARY) {
			PORTFOLIO_SUMMARY.update((data) =>
				data
					? {
							...data,
							baseCurrencyBalance: newBalance,
							totalValue: newBalance + data.totalCoinValue
						}
					: null
			);
		}
	}

	$effect(() => {
		if ($USER_DATA && $PORTFOLIO_SUMMARY) {
			balance = $PORTFOLIO_SUMMARY.baseCurrencyBalance;
		}
	});
</script>

<SEO
	title="Arcade - Vellum"
	description="Play Vellum's arcade with coinflip, slots, mines, dice, tower, and the wheel of fortune. Six polished games, one leaderboard."
	keywords="vellum arcade, coinflip game, slots game, mines game, wheel of fortune, arcade games"
/>

<SignInConfirmDialog bind:open={shouldSignIn} />

<div class="container mx-auto p-4 pb-16 md:p-6">
	{#if !$USER_DATA}
		<div class="flex h-96 items-center justify-center">
			<div class="text-center">
				<div class="text-muted-foreground mb-4 text-xl">Sign in to play</div>
				<p class="text-muted-foreground mb-4 text-sm">You need an account to play arcade games</p>
				<Button onclick={() => (shouldSignIn = true)}>Sign In</Button>
			</div>
		</div>
	{:else}
		<!-- Hero -->
		<section class="vellum-panel relative mb-6 overflow-hidden rounded-2xl p-6 md:p-8">
			<div class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.28),transparent_65%)]"></div>
			<div class="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.2),transparent_65%)]"></div>
			<div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
					<div class="hidden h-14 w-14 shrink-0 sm:block">
						<GameArt game="wheel" class="h-full w-full" />
					</div>
					<div>
						<div class="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">Vellum</div>
						<h1 class="text-3xl font-bold tracking-tight md:text-4xl">The Arcade</h1>
						<p class="text-muted-foreground mt-1 text-sm md:text-base">
							Six games. One house. How far will you push it?
						</p>
					</div>
				</div>
				<div class="flex flex-wrap items-center gap-3">
					<div class="rounded-xl border bg-background/60 px-4 py-2.5 backdrop-blur">
						<div class="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">Balance</div>
						<div class="text-success font-mono text-lg font-bold">{formatValue(balance)}</div>
					</div>
				</div>
			</div>
		</section>

		{#if activeGame && activeMeta}
			<div class="mx-auto max-w-4xl space-y-6">
				<div class="flex items-center justify-between gap-4">
					<Button variant="outline" size="sm" onclick={() => (activeGame = null)}>
						← All games
					</Button>
					<div class="text-right">
						<div class="text-sm font-semibold">{activeMeta.name}</div>
						<div class="text-muted-foreground text-xs">{activeMeta.tagline}</div>
					</div>
				</div>

				{#if activeGame === 'coinflip'}
					<Coinflip bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{:else if activeGame === 'slots'}
					<Slots bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{:else if activeGame === 'mines'}
					<Mines bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{:else if activeGame === 'dice'}
					<Dice bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{:else if activeGame === 'tower'}
					<Tower bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{:else if activeGame === 'wheel'}
					<Wheel bind:balance onBalanceUpdate={handleBalanceUpdate} />
				{/if}
			</div>
		{:else}
			<!-- Controls -->
			<div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex flex-wrap gap-1.5 rounded-xl border bg-background/40 p-1.5">
					{#each [
						{ key: 'all', label: 'All' },
						{ key: 'luck', label: 'Luck' },
						{ key: 'skill', label: 'Skill' }
					] as cat (cat.key)}
						<button
							type="button"
							onclick={() => (categoryFilter = cat.key as typeof categoryFilter)}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 {categoryFilter ===
							cat.key
								? 'bg-primary text-primary-foreground shadow-md'
								: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
						>
							{cat.label}
						</button>
					{/each}
				</div>
				<input
					type="text"
					placeholder="Search games..."
					bind:value={searchQuery}
					class="h-9 w-full rounded-lg border bg-background/60 px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 sm:w-56"
				/>
			</div>

			<!-- Game library -->
			{#if filteredGames.length === 0}
				<div class="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
					<div class="text-muted-foreground mb-2 text-sm">No games match your search</div>
					<Button
						variant="outline"
						size="sm"
						onclick={() => {
							searchQuery = '';
							categoryFilter = 'all';
						}}
					>
						Clear filters
					</Button>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredGames as game (game.key)}
						<button
							type="button"
							onclick={() => (activeGame = game.key)}
							class="group animate-vellum-rise relative overflow-hidden rounded-2xl border bg-card text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_50px_-24px_rgba(139,92,246,0.45)]"
							style={`animation-delay: ${GAMES.indexOf(game) * 60}ms`}
						>
							<div class="relative h-32 overflow-hidden bg-gradient-to-br {game.accent} to-transparent">
								<div class="absolute inset-0 flex items-center justify-center p-4">
									<GameArt game={game.key} class="h-full max-h-full" />
								</div>
								<div class="absolute left-3 top-3 flex gap-1.5">
									{#if game.featured}
										<span class="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yellow-950 shadow">
											Featured
										</span>
									{/if}
									{#if game.trending}
										<span class="rounded-full bg-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
											Trending
										</span>
									{/if}
								</div>
								<div class="text-muted-foreground/70 absolute right-3 top-3 text-[10px] font-semibold uppercase tracking-wider">
									{game.category}
								</div>
							</div>
							<div class="p-4">
								<div class="flex items-center justify-between gap-2">
									<h3 class="text-base font-bold tracking-tight">{game.name}</h3>
									<span class="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
										{game.difficulty}
									</span>
								</div>
								<p class="text-muted-foreground mt-1 text-sm">{game.tagline}</p>
								<div class="mt-4 flex items-center justify-between">
									<span class="text-primary inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-200 group-hover:translate-x-0.5">
										Play now →
									</span>
									<span class="text-muted-foreground text-xs">Win up to 100x</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{/if}

		<!-- Live Arcade Activity Feed -->
		<div class="mx-auto mt-8 max-w-4xl">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<span class="relative flex h-2.5 w-2.5">
							<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"></span>
							<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
						</span>
						Live bets
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#if filteredActivities.length === 0}
							<div class="flex flex-col items-center justify-center py-8 text-center">
								<HugeiconsIcon icon={PiggyBankIcon} class="text-muted-foreground/50 mb-4 h-12 w-12" />
								<h3 class="mb-2 text-base font-semibold">Waiting for activity...</h3>
								<p class="text-muted-foreground text-sm">
									High stakes arcade activity will appear here in real-time.
								</p>
							</div>
						{:else}
							{#each filteredActivities as activity (`${activity.userId}-${activity.game}-${activity.timestamp}`)}
								<div
									class="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
								>
									<div class="flex items-center gap-3">
										<HoverCard.Root>
											<HoverCard.Trigger
												class="cursor-pointer font-medium underline-offset-4 hover:underline"
											>
												<div class="flex items-center gap-2">
													<Avatar.Root class="h-6 w-6">
														<Avatar.Image
															src={getPublicUrl(activity.userImage ?? null)}
															alt={activity.username}
														/>
														<Avatar.Fallback class="text-xs"
															>{activity.username.charAt(0).toUpperCase()}</Avatar.Fallback
														>
													</Avatar.Root>
													<span class="text-sm">@{activity.username}</span>
												</div>
											</HoverCard.Trigger>
											<HoverCard.Content class="w-80" side="top" sideOffset={3}>
												<UserProfilePreview userId={parseInt(activity.userId)} />
											</HoverCard.Content>
										</HoverCard.Root>

										<span class="text-muted-foreground text-sm">{activity.won ? 'won' : 'lost'}</span>
										<span
											class="font-mono text-sm font-medium {activity.won
												? 'text-green-500'
												: 'text-red-500'}"
										>
											{formatValue(activity.amount)}
										</span>
										<span class="text-muted-foreground text-sm">on {activity.game}</span>
									</div>

									<div class="text-muted-foreground flex items-center gap-1 text-xs">
										<HugeiconsIcon icon={Clock01Icon} class="h-3 w-3" />
										<span class="font-mono">{formatRelativeTime(new Date(activity.timestamp))}</span>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</CardContent>
				<CardFooter>
					<p class="text-muted-foreground text-xs">Showing bets of $1,000 or more only</p>
				</CardFooter>
			</Card>
		</div>
	{/if}
</div>
