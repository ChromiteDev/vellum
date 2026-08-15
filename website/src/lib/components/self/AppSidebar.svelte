<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Activity01Icon, TradeUpIcon, TradeDownIcon, Wallet01Icon, CrownIcon, GemIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons';
	import VellumIcon, { type VellumIconName } from './VellumIcon.svelte';
	import { mode, setMode } from 'mode-watcher';
	import type { HTMLAttributes } from 'svelte/elements';
	import { USER_DATA } from '$lib/stores/user-data';
	import { PORTFOLIO_SUMMARY, fetchPortfolioSummary } from '$lib/stores/portfolio-data';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import SignInConfirmDialog from './SignInConfirmDialog.svelte';
	import DailyRewards from './DailyRewards.svelte';
	import PromoCodeDialog from './PromoCodeDialog.svelte';
	import UserManualModal from './UserManualModal.svelte';
	import { signOut } from '$lib/auth-client';
	import { formatValue, getPublicUrl } from '$lib/utils';
	import { goto } from '$app/navigation';
	import { liveTradesStore, isLoadingTrades } from '$lib/stores/websocket';
	import { onMount } from 'svelte';
	import { UNREAD_COUNT, fetchNotifications } from '$lib/stores/notifications';
	import { NEW_ACHIEVEMENTS_COUNT } from '$lib/stores/achievements';
	import { ARCADE_STATS, fetchArcadeStats } from '$lib/stores/arcade-stats';
	import { GEMS_BALANCE, fetchGemsBalance } from '$lib/stores/gems';

	const data: { navMain: { title: string; url: string; icon: VellumIconName }[] } = {
		navMain: [
			{ title: 'Home', url: '/', icon: 'home' },
			{ title: 'Market', url: '/market', icon: 'market' },
			{ title: 'Hopium', url: '/hopium', icon: 'hopium' },
			{ title: 'Arcade', url: '/arcade', icon: 'arcade' },
			{ title: 'Leaderboard', url: '/leaderboard', icon: 'leaderboard' },
			{ title: 'Shop', url: '/shop', icon: 'shop' },
			{ title: 'Achievements', url: '/achievements', icon: 'achievements' },
			{ title: 'Roadmap', url: '/roadmap', icon: 'community' },
			{ title: 'Portfolio', url: '/portfolio', icon: 'portfolio' },
			{ title: 'Treemap', url: '/treemap', icon: 'treemap' },
			{ title: 'Create coin', url: '/coin/create', icon: 'create' },
			{ title: 'Notifications', url: '/notifications', icon: 'bell' },
			{ title: 'About', url: '/about', icon: 'about' }
		]
	};
	type MenuButtonProps = HTMLAttributes<HTMLAnchorElement | HTMLButtonElement>;

	const { setOpenMobile, isMobile } = useSidebar();
	let shouldSignIn = $state(false);
	let showPromoCode = $state(false);
	let showUserManual = $state(false);

	onMount(() => {
		if ($USER_DATA) {
			fetchPortfolioSummary();
			fetchNotifications();
			fetchArcadeStats();
			fetchGemsBalance();
			fetch('/api/achievements/unclaimed')
				.then((r) => r.json())
				.then((d) => NEW_ACHIEVEMENTS_COUNT.set(d.count))
				.catch(() => {});
		} else {
			PORTFOLIO_SUMMARY.set(null);
			ARCADE_STATS.set(null);
		}
	});

	function handleNavClick(title: string) {
		setOpenMobile(false);
	}

	function handleModeToggle() {
		setMode(mode.current === 'light' ? 'dark' : 'light');
		// Remove setOpenMobile(false) to keep menu open
	}

	function formatCurrency(value: number): string {
		return value.toLocaleString('en-US', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function handleLiveTradesClick() {
		goto('/live');
		setOpenMobile(false);
	}

	async function handleTradeClick(coinSymbol: string, trade: any) {
		if (trade.type === 'TRANSFER_IN' || trade.type === 'TRANSFER_OUT') {
			const targetPath = `/user/${trade.username}`;
			await goto(targetPath, { invalidateAll: true });
		} else {
			const targetPath = `/coin/${coinSymbol.toLowerCase()}`;
			await goto(targetPath, { invalidateAll: true });
		}
		setOpenMobile(false);
	}

	function handleAccountClick() {
		if ($USER_DATA) {
			goto(`/user/${$USER_DATA.id}`);
			setOpenMobile(false);
		}
	}

	function handleSettingsClick() {
		goto('/settings');
		setOpenMobile(false);
	}

	function handleAdminClick() {
		goto('/admin');
		setOpenMobile(false);
	}

	function handleFounderClick() {
		goto('/founder');
		setOpenMobile(false);
	}

	function handleUserManagementClick() {
		goto('/admin/users');
		setOpenMobile(false);
	}

	function handlePromoCodesClick() {
		goto('/admin/promo');
		setOpenMobile(false);
	}

	function handleSeasonSettingsClick() {
		goto('/admin/seasons');
		setOpenMobile(false);
	}

	function handleTermsClick() {
		goto('/legal/terms');
		setOpenMobile(false);
	}

	function handlePrivacyClick() {
		goto('/legal/privacy');
		setOpenMobile(false);
	}

	function handleUserManualClick() {
		showUserManual = true;
		setOpenMobile(false);
	}

	function handlePrestigeClick() {
		goto('/prestige');
		setOpenMobile(false);
	}

	function handleAPIClick() {
		goto('/api');
		setOpenMobile(false);
	}
</script>

<SignInConfirmDialog bind:open={shouldSignIn} />
<PromoCodeDialog bind:open={showPromoCode} />
<UserManualModal bind:open={showUserManual} />
<Sidebar.Root collapsible="offcanvas">
	<Sidebar.Header>
		<div class="flex items-center gap-2 px-2 py-2">
			<img src="/vellum.svg" class="h-5 w-5" alt="Vellum" />
			<div class="flex items-center gap-2">
				<span class="text-base font-semibold">Vellum</span>
				{#if $USER_DATA?.isFounder}
					<span class="text-primary text-xs">| Founder</span>
				{:else if $USER_DATA?.isAdmin}
					<span class="text-muted-foreground text-xs">| Admin</span>
				{/if}
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each data.navMain as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton>
								{#snippet child({ props }: { props: MenuButtonProps })}
									<a
										href={item.url || '/'}
										onclick={() => handleNavClick(item.title)}
										class={`${props.class} h-7! ${item.title === 'Notifications' && !$USER_DATA ? 'pointer-events-none opacity-50' : ''}`}
									>
										<VellumIcon name={item.icon} />
										<span>{item.title}</span>
										{#if item.title === 'Notifications' && $UNREAD_COUNT > 0 && $USER_DATA}
											<Sidebar.MenuBadge class="bg-primary text-primary-foreground">
												{$UNREAD_COUNT > 99 ? '99+' : $UNREAD_COUNT}
											</Sidebar.MenuBadge>
										{/if}
										{#if item.title === 'Achievements' && $NEW_ACHIEVEMENTS_COUNT > 0 && $USER_DATA}
											<Sidebar.MenuBadge class="bg-yellow-500 text-black">
												{$NEW_ACHIEVEMENTS_COUNT > 99 ? '99+' : $NEW_ACHIEVEMENTS_COUNT}
											</Sidebar.MenuBadge>
										{/if}
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<!-- Daily Rewards -->
		{#if $USER_DATA}
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<div class="px-2 py-1">
						{#if !$PORTFOLIO_SUMMARY}
							<div class="space-y-2">
								<Skeleton class="h-8 w-full rounded" />
							</div>
						{:else}
							<DailyRewards />
						{/if}
					</div>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}

		<!-- Live Trades -->
		<Sidebar.Group>
			<Sidebar.GroupLabel class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<HugeiconsIcon icon={Activity01Icon} class="h-4 w-4" />
					<span>Live Trades</span>
				</div>
				<button
					onclick={handleLiveTradesClick}
					class="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
				>
					View All
				</button>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<div class="space-y-1 px-2 py-1">
					{#if $isLoadingTrades}
						{#each Array(5) as _, i}
							<div class="flex items-center gap-2 py-1 text-xs">
								<div class="flex items-center gap-1">
									<Skeleton class="h-3 w-3 rounded-full" />
									<Skeleton class="h-4 w-8" />
								</div>
								<div class="flex-1">
									<div class="flex items-center gap-1">
										<Skeleton class="h-3 w-12" />
										<Skeleton class="h-3 w-28" />
									</div>
								</div>
							</div>
						{/each}
					{:else if $liveTradesStore.length === 0}
						<div class="text-muted-foreground py-2 text-center text-xs">No big trades yet...</div>
					{:else}
						{#each $liveTradesStore.slice(0, 5) as trade, index (`${trade.timestamp}-${trade.username}-${trade.coinSymbol}-${index}`)}
							<button
								onclick={() => handleTradeClick(trade.coinSymbol, trade)}
								class="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded px-1 py-1 text-left text-xs transition-colors"
							>
								<div class="flex items-center gap-1">
									{#if trade.type === 'TRANSFER_IN' || trade.type === 'TRANSFER_OUT'}
										<HugeiconsIcon icon={Activity01Icon} class="h-3 w-3 text-blue-500" />
										<Badge
											variant="outline"
											class="h-4 border-blue-500 px-1 py-0 text-[10px] text-blue-500"
										>
											{trade.type === 'TRANSFER_IN' ? 'REC' : 'SENT'}
										</Badge>
									{:else if trade.type === 'BUY'}
										<HugeiconsIcon icon={TradeUpIcon} class="h-3 w-3 text-green-500" />
										<Badge
											variant="outline"
											class="h-4 border-green-500 px-1 py-0 text-[10px] text-green-500"
										>
											BUY
										</Badge>
									{:else}
										<HugeiconsIcon icon={TradeDownIcon} class="h-3 w-3 text-red-500" />
										<Badge
											variant="outline"
											class="h-4 border-red-500 px-1 py-0 text-[10px] text-red-500"
										>
											SELL
										</Badge>
									{/if}
								</div>
								<div class="flex-1 truncate">
									<div class="flex items-center gap-1">
										<span class="text-foreground font-medium">
											{formatValue(trade.totalValue)}
										</span>
										{#if trade.type === 'TRANSFER_IN' || trade.type === 'TRANSFER_OUT'}
											{#if trade.amount > 0}
												<span class="text-muted-foreground">*{trade.coinSymbol}</span>
											{/if}
											<span class="text-muted-foreground">
												{trade.type === 'TRANSFER_IN' ? 'to' : 'from'}
											</span>
										{:else}
											<span class="text-muted-foreground">*{trade.coinSymbol}</span>
											<span class="text-muted-foreground">by</span>
										{/if}
										<span class="text-muted-foreground">@{trade.username}</span>
									</div>
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</Sidebar.GroupContent>
		</Sidebar.Group>

		<!-- Portfolio Summary -->
		{#if $USER_DATA}
			<Sidebar.Group>
				<Sidebar.GroupLabel>Portfolio</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<div class="space-y-2 px-2 py-1">
						{#if !$PORTFOLIO_SUMMARY}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Skeleton class="h-4 w-4 rounded" />
									<Skeleton class="h-4 w-16" />
								</div>
								<Skeleton class="h-5 w-16 rounded" />
							</div>
							<div class="space-y-1">
								<div class="flex justify-between">
									<Skeleton class="h-3 w-8" />
									<Skeleton class="h-3 w-12" />
								</div>
								<div class="flex justify-between">
									<Skeleton class="h-3 w-10" />
									<Skeleton class="h-3 w-12" />
								</div>
							</div>
						{:else}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<HugeiconsIcon icon={Wallet01Icon} class="text-muted-foreground h-4 w-4" />
									<span class="text-sm font-medium">Total Value</span>
								</div>
								<Badge variant="secondary" class="font-mono">
									${formatCurrency($PORTFOLIO_SUMMARY.totalValue)}
								</Badge>
							</div>
							<div class="text-muted-foreground space-y-1 text-xs">
								<div class="flex justify-between">
									<span>Cash:</span>
									<span class="font-mono" style="color: #00ff0d"
										>${formatCurrency($PORTFOLIO_SUMMARY.baseCurrencyBalance)}</span
									>
								</div>
								<div class="flex justify-between">
									<span>Coins:</span>
									<span class="font-mono" style="color: #00ff0d">${formatCurrency($PORTFOLIO_SUMMARY.totalCoinValue)}</span
									>
								</div>
								{#if $GEMS_BALANCE !== null}
									<div class="flex justify-between">
										<span>Gems:</span>
										<span class="font-mono" style="color: #ca00ff"><HugeiconsIcon icon={GemIcon} size={14} strokeWidth={2} style="display: inline; vertical-align: middle; color: #ca00ff" /> {$GEMS_BALANCE.toLocaleString()}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/if}
	</Sidebar.Content>

	{#if $USER_DATA}
		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Sidebar.MenuButton
									size="lg"
									class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
									{...props}
								>
									<Avatar.Root class="size-8 rounded-lg">
										<Avatar.Image src={getPublicUrl($USER_DATA.image)} alt={$USER_DATA.name} />
										<Avatar.Fallback class="rounded-lg">?</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">{$USER_DATA.name}</span>
										<span class="truncate text-xs">@{$USER_DATA.username}</span>
									</div>
									<HugeiconsIcon icon={ArrowDown01Icon} class="ml-auto size-4" />
								</Sidebar.MenuButton>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg p-2"
							side={isMobile ? 'bottom' : 'right'}
							align="end"
							sideOffset={4}
						>
							<DropdownMenu.Label class="p-0 font-normal">
								<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
									<Avatar.Root class="size-8 rounded-lg">
										<Avatar.Image src={getPublicUrl($USER_DATA.image)} alt={$USER_DATA.name} />
										<Avatar.Fallback class="rounded-lg">?</Avatar.Fallback>
									</Avatar.Root>
									<div class="grid flex-1 text-left text-sm leading-tight">
										<span class="truncate font-medium">{$USER_DATA.name}</span>
										<span class="truncate text-xs">@{$USER_DATA.username}</span>
									</div>
								</div>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />

							<!-- Profile & Settings Group -->
							<DropdownMenu.Group>
								<DropdownMenu.Item onclick={handleAccountClick}>
									<VellumIcon name="profile" size={16} />
									Account
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={handleSettingsClick}>
									<VellumIcon name="settings" size={16} />
									Settings
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={handlePrestigeClick}>
									<HugeiconsIcon icon={CrownIcon} />
									Prestige
								</DropdownMenu.Item>
							</DropdownMenu.Group>

							<DropdownMenu.Separator />

							<!-- Features Group -->
							<DropdownMenu.Group>
								<DropdownMenu.Item onclick={handleAPIClick}>
									<VellumIcon name="key" size={16} />
									API
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={() => {
										showPromoCode = true;
										setOpenMobile(false);
									}}
								>
									<VellumIcon name="gift" size={16} />
									Promo code
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={handleUserManualClick}>
									<VellumIcon name="book" size={16} />
									User Manual
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={handleModeToggle}>
									{#if mode.current === 'light'}
										<VellumIcon name="moon" size={16} />
										Dark Mode
									{:else}
										<VellumIcon name="sun" size={16} />
										Light Mode
									{/if}
								</DropdownMenu.Item>
							</DropdownMenu.Group>

							{#if $USER_DATA?.isAdmin}
								<DropdownMenu.Separator />
								<!-- Admin Group -->
								<DropdownMenu.Group>
									<DropdownMenu.Item
										onclick={handleAdminClick}
										class="text-primary hover:text-primary!"
									>
										<VellumIcon name="admin" size={16} class="text-primary" />
										Admin Panel
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={handleUserManagementClick}
										class="text-primary hover:text-primary!"
									>
										<VellumIcon name="admin" size={16} class="text-primary" />
										User Management
									</DropdownMenu.Item>
									<DropdownMenu.Item
										onclick={handlePromoCodesClick}
										class="text-primary hover:text-primary!"
									>
										<VellumIcon name="gift" size={16} class="text-primary" />
										Manage codes
									</DropdownMenu.Item>
							</DropdownMenu.Group>
						{/if}

						{#if $USER_DATA?.isFounder}
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item
									onclick={handleFounderClick}
									class="text-primary hover:text-primary!"
								>
									<VellumIcon name="founder" size={16} class="text-primary" />
									Founder Command Center
								</DropdownMenu.Item>
								<DropdownMenu.Item
									onclick={handleSeasonSettingsClick}
									class="text-primary hover:text-primary!"
								>
									<VellumIcon name="season" size={16} class="text-primary" />
									Season settings
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						{/if}

							<DropdownMenu.Separator />

							<!-- Legal Group -->
							<DropdownMenu.Group>
								<DropdownMenu.Item onclick={handleTermsClick}>
									<VellumIcon name="book" size={16} />
									Terms of Service
								</DropdownMenu.Item>
								<DropdownMenu.Item onclick={handlePrivacyClick}>
									<VellumIcon name="about" size={16} />
									Privacy Policy
								</DropdownMenu.Item>
							</DropdownMenu.Group>

							<DropdownMenu.Separator />

							<!-- Sign Out -->
							<DropdownMenu.Item
								onclick={() => {
									signOut().then(() => {
										USER_DATA.set(null);
										window.location.reload();
									});
								}}
							>
								<VellumIcon name="logout" size={16} />
								Log out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	{:else}
		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props }: { props: MenuButtonProps })}
							<a href="/legal/terms" onclick={handleTermsClick} class={`${props.class}`}>
								<VellumIcon name="book" size={16} />
								<span>Terms of Service</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton>
						{#snippet child({ props }: { props: MenuButtonProps })}
							<a href="/legal/privacy" onclick={handlePrivacyClick} class={`${props.class}`}>
								<VellumIcon name="about" size={16} />
								<span>Privacy Policy</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	{/if}
</Sidebar.Root>
