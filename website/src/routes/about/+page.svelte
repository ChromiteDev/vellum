<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		BookOpen01Icon,
		GithubIcon,
		UserIcon,
		Coins01Icon,
		TradeUpIcon
	} from '@hugeicons/core-free-icons';
	import UserManualModal from '$lib/components/self/UserManualModal.svelte';

	let showUserManual = $state(false);
	function handleManual() {
		showUserManual = !showUserManual;
	}
</script>

<UserManualModal bind:open={showUserManual} />

<svelte:head>
	<title>About - Vellum</title>
	<meta
		name="description"
		content="Learn about Vellum - a realistic cryptocurrency market with live liquidity pools, coin launches, and a full arcade."
	/>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8">
	<div class="space-y-4 text-center">
		<div class="mb-4 flex items-center justify-center gap-2">
			<img src="/vellum.svg" class="h-12 w-12" alt="Vellum" />
			<h1 class="text-4xl font-bold">Vellum</h1>
		</div>
		<p class="text-muted-foreground mx-auto max-w-2xl text-lg">
			A live crypto market where you trade, launch coins, and climb. Practice real strategy in a
			risk-free environment.
		</p>
		<div class="flex flex-wrap justify-center gap-4">
			<Button onclick={handleManual} size="lg">
				<HugeiconsIcon icon={BookOpen01Icon} class="h-4 w-4" />
				User Manual
			</Button>
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<HugeiconsIcon icon={Coins01Icon} class="text-primary h-5 w-5" />
					About Vellum
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					<p class="text-muted-foreground text-sm">
						Vellum is a realistic cryptocurrency market focused on DeFi (Decentralized Finance)
						mechanics and the dynamics of decentralized trading.
					</p>
					<p class="text-muted-foreground text-sm">
						Practice trading strategies, create your own coins, and learn market dynamics in a
						risk-free environment. Experience AMM trading, liquidity pools, and the full market
						cycle.
					</p>
					<p class="text-muted-foreground text-sm">
						Join a community where reading the market is the whole game.
					</p>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<HugeiconsIcon icon={TradeUpIcon} class="text-primary h-5 w-5" />
					Features
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm">
						<span>🪙</span>
						<span>Create coins</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>🟢</span>
						<span>Buy coins</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>🔴</span>
						<span>Sell coins</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>⚖️</span>
						<span>Predict on questions (similar to Polymarket)</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>🎲</span>
						<span>Play arcade games</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>📊</span>
						<span>View a Treemap graph of the entire market</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<span>🏆</span>
						<span>Compete on leaderboards</span>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<HugeiconsIcon icon={UserIcon} class="text-primary h-5 w-5" />
					Credits
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<p class="text-muted-foreground text-sm">Created by the <strong>Vellum</strong> team</p>
					<div class="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							href="https://github.com/vellum"
							target="_blank"
							rel="noopener"
						>
							<HugeiconsIcon icon={GithubIcon} class="h-4 w-4" />
							GitHub
						</Button>
					</div>
					<p class="text-muted-foreground text-sm">Achievement icons by <a href="https://twitter.com/gvesster" target="_blank" rel="noopener" class="text-primary underline">gvstr</a></p>
					<p class="text-muted-foreground text-sm">Chest animations by <a href="https://admurin.itch.io/" target="_blank" rel="noopener" class="text-primary underline">admurin</a></p>
					<p class="text-muted-foreground text-sm">Halloween badge by <a href="https://www.flaticon.com/authors/smalllikeart" target="_blank" rel="noopener" class="text-primary underline">smalllikeart</a></p>
				</div>
			</CardContent>
		</Card>
	</div>

</div>
