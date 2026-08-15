<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import DataTable from '$lib/components/self/DataTable.svelte';
	import ProfileBadges from '$lib/components/self/ProfileBadges.svelte';
	import UserName from '$lib/components/self/UserName.svelte';
	import ProfileSkeleton from '$lib/components/self/skeletons/ProfileSkeleton.svelte';
	import SEO from '$lib/components/self/SEO.svelte';
	import { getPublicUrl, formatPrice, formatValue, formatQuantity, formatDate } from '$lib/utils';
	import { getBannerPreset } from '$lib/data/profile-customization';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Calendar01Icon,
		Wallet01Icon,
		TradeUpIcon,
		TradeDownIcon,
		Coins01Icon,
		Activity01Icon,
		Invoice03Icon,
		Award05Icon,
		UnavailableIcon,
		GameController03Icon
	} from '@hugeicons/core-free-icons';
	import { Gem, Package, Trophy, Play, Pause } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { USER_DATA } from '$lib/stores/user-data';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { haptic } from '$lib/stores/haptics';

	let { data } = $props();
	let username = $derived(data.username);

	let profileData = $state(data.profileData);
	let recentTransactions = $state(data.recentTransactions);
	let loading = $state(false);
	let userAchievements = $state<any[]>([]);

	let previousUsername = $state<string | null>(null);

	$effect(() => {
		profileData = data.profileData;
		recentTransactions = data.recentTransactions;
	});

	let isOwnProfile = $derived(
		$USER_DATA && profileData?.profile && $USER_DATA.username === profileData.profile.username
	);

	let isBlocked = $state(false);
	let blockLoading = $state(false);

	async function checkBlockStatus() {
		if (!$USER_DATA || isOwnProfile) return;
		try {
			const res = await fetch('/api/settings/blocked');
			if (res.ok) {
				const data = await res.json();
				isBlocked = data.blocks?.some((b: any) => b.username === username) ?? false;
			}
		} catch { /* silent */ }
	}

	async function toggleBlock() {
		if (!$USER_DATA || isOwnProfile || blockLoading) return;
		blockLoading = true;
		try {
			const res = await fetch(`/api/user/${username}/block`, {
				method: isBlocked ? 'DELETE' : 'POST',
			});
			if (res.ok) {
				isBlocked = !isBlocked;
				haptic.trigger(isBlocked ? 'warning' : 'light');
				toast.success(isBlocked ? 'User blocked' : 'User unblocked');
			} else {
				const data = await res.json();
				toast.error(data.message || 'Failed to update block status');
			}
		} catch {
			toast.error('Failed to update block status');
		} finally {
			blockLoading = false;
		}
	}

	onMount(async () => {
		previousUsername = username;
		fetchAchievements();
		checkBlockStatus();

		if (isOwnProfile) {
			await fetchTransactions();
		}
	});

	$effect(() => {
		if (username && previousUsername && username !== previousUsername) {
			userAchievements = [];
			fetchAchievements();
			checkBlockStatus();
			previousUsername = username;
		}
	});

	$effect(() => {
		if (isOwnProfile && profileData) {
			fetchTransactions();
		}
	});

	async function fetchProfileData() {
		try {
			const response = await fetch(`/api/user/${username}`);
			if (response.ok) {
				profileData = await response.json();
				recentTransactions = profileData?.recentTransactions || [];
			} else {
				toast.error('Failed to load profile data');
			}
		} catch (e) {
			console.error('Failed to fetch profile data:', e);
			toast.error('Failed to load profile data');
		} finally {
			loading = false;
		}
	}

	async function fetchTransactions() {
		if (!isOwnProfile) return;

		try {
			const response = await fetch('/api/transactions?limit=10');
			if (response.ok) {
				const data = await response.json();
				recentTransactions = data.transactions || [];
			}
		} catch (e) {
			console.error('Failed to fetch transactions:', e);
		}
	}

	async function fetchAchievements() {
		try {
			const res = await fetch(`/api/user/${username}/achievements`);
			if (res.ok) {
				const data = await res.json();
				userAchievements = data.achievements || [];
			}
		} catch {
			// silent fail
		}
	}

	let memberSince = $derived(
		profileData?.profile
			? new Date(profileData.profile.createdAt).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long'
				})
			: ''
	);
	let hasCreatedCoins = $derived(
		profileData?.createdCoins?.length ? profileData.createdCoins.length > 0 : false
	);

	let totalTradingVolume = $derived(
		profileData?.stats
			? Number(profileData.stats.totalBuyVolume) + Number(profileData.stats.totalSellVolume)
			: 0
	);

	let buyPercentage = $derived(
		profileData?.stats && totalTradingVolume > 0
			? (Number(profileData.stats.totalBuyVolume) / totalTradingVolume) * 100
			: 0
	);
	let sellPercentage = $derived(
		profileData?.stats && totalTradingVolume > 0
			? (Number(profileData.stats.totalSellVolume) / totalTradingVolume) * 100
			: 0
	);

	let totalPortfolioValue = $derived(
		profileData?.stats?.totalPortfolioValue ? Number(profileData.stats.totalPortfolioValue) : 0
	);
	let baseCurrencyBalance = $derived(
		profileData?.stats?.baseCurrencyBalance ? Number(profileData.stats.baseCurrencyBalance) : 0
	);
	let holdingsValue = $derived(
		profileData?.stats?.holdingsValue ? Number(profileData.stats.holdingsValue) : 0
	);
	let totalBuyVolume = $derived(
		profileData?.stats?.totalBuyVolume ? Number(profileData.stats.totalBuyVolume) : 0
	);
	let totalSellVolume = $derived(
		profileData?.stats?.totalSellVolume ? Number(profileData.stats.totalSellVolume) : 0
	);
	let buyVolume24h = $derived(
		profileData?.stats?.buyVolume24h ? Number(profileData.stats.buyVolume24h) : 0
	);
	let sellVolume24h = $derived(
		profileData?.stats?.sellVolume24h ? Number(profileData.stats.sellVolume24h) : 0
	);

	let totalTradingVolumeAllTime = $derived(totalBuyVolume + totalSellVolume);

	let totalTradingVolume24h = $derived(buyVolume24h + sellVolume24h);

	// Arcade records (money amounts)
	let arcadeWins = $derived(
		profileData?.profile?.arcadeWins ? Number(profileData.profile.arcadeWins) : 0
	);
	let arcadeLosses = $derived(
		profileData?.profile?.arcadeLosses ? Number(profileData.profile.arcadeLosses) : 0
	);
	let arcadeNet = $derived(arcadeWins - arcadeLosses);
	let gamesPlayed = $derived(
		profileData?.profile?.totalArcadeGamesPlayed
			? Number(profileData.profile.totalArcadeGamesPlayed)
			: 0
	);
	let bestWinStreak = $derived(
		profileData?.profile?.arcadeBestWinStreak ? Number(profileData.profile.arcadeBestWinStreak) : 0
	);
	let totalWagered = $derived(
		profileData?.profile?.totalArcadeWagered ? Number(profileData.profile.totalArcadeWagered) : 0
	);

	// Identity / collection
	let gems = $derived(profileData?.profile?.gems ? Number(profileData.profile.gems) : 0);
	let cratesOpened = $derived(
		profileData?.profile?.cratesOpened ? Number(profileData.profile.cratesOpened) : 0
	);
	let prestigeLevel = $derived(
		profileData?.profile?.prestigeLevel ? Number(profileData.profile.prestigeLevel) : 0
	);

	let bannerGradient = $derived.by(() => {
		if (prestigeLevel >= 5)
			return 'linear-gradient(120deg, rgb(251 191 36 / 0.32), rgb(249 115 22 / 0.12) 55%, transparent)';
		if (prestigeLevel >= 3)
			return 'linear-gradient(120deg, rgb(217 70 239 / 0.28), rgb(168 85 247 / 0.12) 55%, transparent)';
		if (prestigeLevel >= 1)
			return 'linear-gradient(120deg, rgb(59 130 246 / 0.28), rgb(99 102 241 / 0.12) 55%, transparent)';
		return 'linear-gradient(120deg, rgb(139 92 246 / 0.3), rgb(99 102 241 / 0.14) 55%, transparent)';
	});

	let profileBannerCss = $derived.by(() => {
		const p = profileData?.profile;
		if (p?.bannerImage) return 'transparent';
		const preset = getBannerPreset(p?.bannerColor);
		if (preset) return preset.css;
		return bannerGradient;
	});

	let profileSongKey = $derived(profileData?.profile?.profileSong ?? null);
	let profileSongName = $derived(profileData?.profile?.profileSongName ?? 'Profile track');
	let hasSong = $derived(!!profileSongKey);

	let musicPlaying = $state(false);
	let musicAudio: HTMLAudioElement | undefined = undefined;
	function toggleMusic() {
		if (!hasSong) return;
		if (musicPlaying) {
			musicAudio?.pause();
			musicPlaying = false;
			return;
		}
		const src = getPublicUrl(profileSongKey);
		if (!src) return;
		if (!musicAudio) {
			musicAudio = new Audio(src);
			musicAudio.loop = true;
			musicAudio.volume = 0.4;
		}
		musicAudio.play().catch(() => {});
		musicPlaying = true;
	}

	const createdCoinsColumns = [
		{
			key: 'coin',
			label: 'Coin',
			class: 'pl-6 font-medium',
			render: (value: any, row: any) => ({
				component: 'coin',
				icon: row.icon,
				symbol: row.symbol,
				name: row.name
			})
		},
		{
			key: 'currentPrice',
			label: 'Price',
			class: 'font-mono',
			render: (value: any) => `$${formatPrice(parseFloat(value))}`
		},
		{
			key: 'marketCap',
			label: 'Market Cap',
			class: 'hidden font-mono sm:table-cell',
			render: (value: any) => formatValue(parseFloat(value))
		},
		{
			key: 'change24h',
			label: '24h Change',
			class: 'hidden md:table-cell',
			render: (value: any) => ({
				component: 'badge',
				variant: parseFloat(value) >= 0 ? 'success' : 'destructive',
				text: `${parseFloat(value) >= 0 ? '+' : ''}${parseFloat(value).toFixed(2)}%`
			})
		},
		{
			key: 'createdAt',
			label: 'Created',
			class: 'text-muted-foreground hidden text-sm lg:table-cell',
			render: (value: any) => formatDate(value)
		}
	];

	const transactionsColumns = [
		{
			key: 'type',
			label: 'Type',
			class: 'w-[12%] min-w-[60px] md:w-[8%] pl-6',
			render: (value: any, row: any) => {
				// Handle transfer types (TRANSFER_IN, TRANSFER_OUT) from user profile API
				if (value === 'TRANSFER_IN' || value === 'TRANSFER_OUT') {
					return {
						component: 'badge',
						variant: 'default',
						text: value === 'TRANSFER_IN' ? 'Received' : 'Sent',
						class: 'text-xs'
					};
				}
				// Handle isTransfer format from transactions API
				if (row.isTransfer) {
					return {
						component: 'badge',
						variant: 'default',
						text: row.isIncoming ? 'Received' : 'Sent',
						class: 'text-xs'
					};
				}
				return {
					component: 'badge',
					variant: value === 'BUY' ? 'success' : 'destructive',
					text: value === 'BUY' ? 'Buy' : 'Sell',
					class: 'text-xs'
				};
			}
		},
		{
			key: 'coin',
			label: 'Coin',
			class: 'w-[20%] min-w-[100px] md:w-[12%]',
			render: (value: any, row: any) => {
				// Handle transfer format from transactions API
				if (row.isTransfer) {
					if (row.isCoinTransfer && row.coin) {
						return {
							component: 'coin',
							icon: row.coin.icon,
							symbol: row.coin.symbol,
							name: `*${row.coin.symbol}`,
							size: 4
						};
					}
					return { component: 'text', text: '-' };
				}
				// Handle transfer types from user profile API
				if (row.type === 'TRANSFER_IN' || row.type === 'TRANSFER_OUT') {
					if (row.coinSymbol && Number(row.quantity) > 0) {
						return {
							component: 'coin',
							icon: row.coinIcon,
							symbol: row.coinSymbol,
							name: `*${row.coinSymbol}`,
							size: 4
						};
					}
					return { component: 'text', text: '-' };
				}
				// Handle regular transactions from both APIs
				return {
					component: 'coin',
					icon: row.coinIcon || row.coin?.icon,
					symbol: row.coinSymbol || row.coin?.symbol,
					name: `*${row.coinSymbol || row.coin?.symbol}`,
					size: 4
				};
			}
		},
		{
			key: 'sender',
			label: 'Sender',
			class: 'w-[12%] min-w-[70px] md:w-[10%]',
			render: (value: any, row: any) => {
				if (row.isTransfer) {
					return {
						component: 'text',
						text: row.sender || 'Unknown',
						class: row.sender && row.sender !== 'Unknown' ? 'font-medium' : 'text-muted-foreground'
					};
				}
				if (row.type === 'TRANSFER_IN' || row.type === 'TRANSFER_OUT') {
					return {
						component: 'text',
						text: row.senderUsername || 'Unknown',
						class: row.senderUsername ? 'font-medium' : 'text-muted-foreground'
					};
				}
				return {
					component: 'text',
					text: '-',
					class: 'text-muted-foreground'
				};
			}
		},
		{
			key: 'recipient',
			label: 'Receiver',
			class: 'w-[12%] min-w-[70px] md:w-[10%]',
			render: (value: any, row: any) => {
				if (row.isTransfer) {
					return {
						component: 'text',
						text: row.recipient || 'Unknown',
						class:
							row.recipient && row.recipient !== 'Unknown' ? 'font-medium' : 'text-muted-foreground'
					};
				}
				if (row.type === 'TRANSFER_IN' || row.type === 'TRANSFER_OUT') {
					return {
						component: 'text',
						text: row.recipientUsername || 'Unknown',
						class: row.recipientUsername ? 'font-medium' : 'text-muted-foreground'
					};
				}
				return {
					component: 'text',
					text: '-',
					class: 'text-muted-foreground'
				};
			}
		},
		{
			key: 'quantity',
			label: 'Quantity',
			class: 'w-[12%] min-w-[70px] md:w-[10%] font-mono text-sm',
			render: (value: any, row: any) => {
				if (
					(row.isTransfer && value === 0) ||
					((row.type === 'TRANSFER_IN' || row.type === 'TRANSFER_OUT') && value === 0)
				) {
					return '-';
				}
				return formatQuantity(parseFloat(value));
			}
		},
		{
			key: 'totalBaseCurrencyAmount',
			label: 'Amount',
			class: 'w-[12%] min-w-[70px] md:w-[10%] font-mono text-sm font-medium',
			render: (value: any) => formatValue(parseFloat(value))
		},
		{
			key: 'timestamp',
			label: 'Date',
			class: 'hidden md:table-cell md:w-[18%] text-muted-foreground text-sm',
			render: (value: any) => formatDate(value)
		}
	];
</script>

<SEO
	title={profileData?.profile?.name
		? `${profileData.profile.name} (@${profileData.profile.username}) - Vellum`
		: `@${username} - Vellum`}
	description={profileData?.profile?.bio
		? `${profileData.profile.bio} - View ${profileData.profile.name}'s trading activity and portfolio on Vellum.`
		: `View @${username}'s profile and trading activity on Vellum.`}
	type="profile"
	image={profileData?.profile?.image ? getPublicUrl(profileData.profile.image) : '/apple-touch-icon.png'}
	imageAlt={profileData?.profile?.name
		? `${profileData.profile.name}'s profile picture`
		: `@${username}'s profile`}
	keywords="crypto trader profile, trading portfolio, user portfolio, vellum profile"
	twitterCard="summary"
/>

<div class="container mx-auto max-w-6xl p-6">
	{#if loading}
		<ProfileSkeleton />
	{:else if !profileData}
		<div class="flex h-96 items-center justify-center">
			<div class="text-center">
				<div class="text-muted-foreground mb-4 text-xl">Failed to load profile</div>
				<Button onclick={fetchProfileData}>Try Again</Button>
			</div>
		</div>
	{:else}
		<!-- Profile Header Hero -->
		<Card.Root class="mb-6 overflow-hidden py-0">
			<div
				class="relative h-28 overflow-hidden sm:h-32"
				style="background: {profileBannerCss};"
			>
				{#if profileData.profile.bannerImage}
					<img
						src={getPublicUrl(profileData.profile.bannerImage)}
						alt={`${profileData.profile.name}'s banner`}
						class="h-full w-full object-cover"
					/>
				{/if}
				<div
					class="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/5 blur-2xl"
				></div>
				{#if hasSong}
					<button
						type="button"
						onclick={toggleMusic}
						class="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
					>
						{#if musicPlaying}
							<Pause class="h-3.5 w-3.5" />
						{:else}
							<Play class="h-3.5 w-3.5" />
						{/if}
						<span class="max-w-[140px] truncate">{profileSongName}</span>
					</button>
				{/if}
			</div>
			<Card.Content class="px-6 pt-0 pb-6">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
					<div class="-mt-12 flex-shrink-0 sm:-mt-14">
						<Avatar.Root class="bg-card size-24 border-4 border-card sm:size-28">
							<Avatar.Image
								src={getPublicUrl(profileData.profile.image)}
								alt={profileData.profile.name}
							/>
							<Avatar.Fallback class="text-2xl"
								>{profileData.profile.name.charAt(0).toUpperCase()}</Avatar.Fallback
							>
						</Avatar.Root>
					</div>

					<div class="min-w-0 flex-1 pb-1">
						<div class="flex flex-wrap items-center gap-2">
							<h1 class="text-2xl font-bold sm:text-3xl"><UserName name={profileData.profile.name} nameColor={profileData.profile.nameColor} /></h1>
							<ProfileBadges user={profileData.profile} />
						</div>
						<p class="text-muted-foreground text-base sm:text-lg">@{profileData.profile.username}</p>

						{#if profileData.profile.bio}
							<p class="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
								{profileData.profile.bio}
							</p>
						{/if}

						<div
							class="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm"
						>
							<span class="inline-flex items-center gap-1.5">
								<HugeiconsIcon icon={Calendar01Icon} class="h-4 w-4" />
								Joined {memberSince}
							</span>
							{#if gems > 0}
								<span class="inline-flex items-center gap-1.5">
									<Gem class="text-primary h-4 w-4" />
									{formatQuantity(gems)} gems
								</span>
							{/if}
							{#if cratesOpened > 0}
								<span class="inline-flex items-center gap-1.5">
									<Package class="text-primary h-4 w-4" />
									{cratesOpened} crates opened
								</span>
							{/if}
							{#if profileData.profile.trophyCount > 0}
								<span class="inline-flex items-center gap-1.5">
									<Trophy class="h-4 w-4 text-yellow-500" />
									{profileData.profile.trophyCount}
									{profileData.profile.trophyCount === 1 ? 'trophy' : 'trophies'}
								</span>
							{/if}
						</div>
					</div>

					{#if $USER_DATA && !isOwnProfile}
						<div class="self-start">
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger>
										<Button
											variant={isBlocked ? 'outline' : 'ghost'}
											size="icon"
											onclick={toggleBlock}
											disabled={blockLoading}
											class="h-8 w-8 {isBlocked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}"
										>
											<HugeiconsIcon icon={UnavailableIcon} class="h-4 w-4" />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>{isBlocked ? 'Unblock' : 'Block'}</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Main Portfolio Stats -->
		<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Total Portfolio Value -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">Total Portfolio</div>
						<HugeiconsIcon icon={Wallet01Icon} class="text-muted-foreground h-4 w-4" />
					</div>
					<div class="mt-1 text-2xl font-bold">
						{formatValue(totalPortfolioValue)}
					</div>
					<p class="text-muted-foreground text-xs">{profileData.stats.holdingsCount} holdings</p>
				</Card.Content>
			</Card.Root>

			<!-- Liquid Value -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">Liquid Value</div>
					</div>
					<div class="text-success mt-1 text-2xl font-bold">
						{formatValue(baseCurrencyBalance)}
					</div>
					<p class="text-muted-foreground text-xs">Available cash</p>
				</Card.Content>
			</Card.Root>

			<!-- Illiquid Value -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">Illiquid Value</div>
					</div>
					<div class="text-success mt-1 text-2xl font-bold">
						{formatValue(holdingsValue)}
					</div>
					<p class="text-muted-foreground text-xs">Coin holdings</p>
				</Card.Content>
			</Card.Root>

			<!-- Buy/Sell Ratio -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">Buy/Sell Ratio</div>
						<div class="flex gap-1">
							<div class="bg-success h-2 w-2 rounded-full"></div>
							<div class="h-2 w-2 rounded-full bg-red-500"></div>
						</div>
					</div>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-success text-xl font-bold">{buyPercentage.toFixed(1)}%</span>
						<span class="text-muted-foreground text-xs">buy</span>
						<span class="text-xl font-bold text-red-600">{sellPercentage.toFixed(1)}%</span>
						<span class="text-muted-foreground text-xs">sell</span>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Buy & Sell Activity Breakdown -->
		<div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
			<!-- Buy Activity -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-foreground text-sm font-medium">Buy Activity</div>
						<HugeiconsIcon icon={TradeUpIcon} class="text-success h-4 w-4" />
					</div>
					<div class="mt-1">
						<div class="text-success text-2xl font-bold">
							{formatValue(totalBuyVolume)}
						</div>
						<div class="text-muted-foreground text-xs">Total amount spent</div>
					</div>
					<div class="border-muted mt-3 border-t pt-3">
						<div class="text-success text-lg font-bold">
							{formatValue(buyVolume24h)}
						</div>
						<div class="text-muted-foreground text-xs">24h buy volume</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Sell Activity -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-foreground text-sm font-medium">Sell Activity</div>
						<HugeiconsIcon icon={TradeDownIcon} class="h-4 w-4 text-red-600" />
					</div>
					<div class="mt-1">
						<div class="text-2xl font-bold text-red-600">
							{formatValue(totalSellVolume)}
						</div>
						<div class="text-muted-foreground text-xs">Total amount received</div>
					</div>
					<div class="border-muted mt-3 border-t pt-3">
						<div class="text-lg font-bold text-red-600">
							{formatValue(sellVolume24h)}
						</div>
						<div class="text-muted-foreground text-xs">24h sell volume</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Total Trading Volume -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">Total Trading Volume</div>
						<Badge variant="outline" class="text-xs">All Time</Badge>
					</div>
					<div class="mt-1 text-2xl font-bold">
						{formatValue(totalTradingVolumeAllTime)}
					</div>
					<div class="text-muted-foreground text-xs">
						{profileData.stats.totalTransactions} total trades
					</div>
				</Card.Content>
			</Card.Root>

			<!-- 24h Trading Volume -->
			<Card.Root class="py-0">
				<Card.Content class="p-4">
					<div class="flex items-center justify-between">
						<div class="text-muted-foreground text-sm font-medium">24h Trading Volume</div>
						<Badge variant="outline" class="text-xs">24h</Badge>
					</div>
					<div class="mt-1 text-2xl font-bold">
						{formatValue(totalTradingVolume24h)}
					</div>
					<div class="text-muted-foreground text-xs">
						{profileData.stats.transactions24h || 0} trades today
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Arcade Records -->
		<div class="mb-6">
			<div class="mb-3 flex items-center gap-2">
				<HugeiconsIcon icon={GameController03Icon} class="text-primary h-5 w-5" />
				<h2 class="text-lg font-semibold">Arcade Records</h2>
			</div>
			<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Games</div>
						<div class="mt-1 text-2xl font-bold tabular-nums">{gamesPlayed.toLocaleString()}</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Wagered</div>
						<div class="mt-1 text-2xl font-bold break-all leading-tight tabular-nums">
							{formatValue(totalWagered)}
						</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Won</div>
						<div class="text-success mt-1 text-2xl font-bold break-all leading-tight tabular-nums">
							{formatValue(arcadeWins)}
						</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Lost</div>
						<div class="mt-1 text-2xl font-bold break-all leading-tight tabular-nums text-red-600">
							{formatValue(arcadeLosses)}
						</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Best Streak</div>
						<div class="mt-1 text-2xl font-bold tabular-nums">{bestWinStreak}</div>
					</Card.Content>
				</Card.Root>
				<Card.Root class="min-w-0 py-0">
					<Card.Content class="p-4">
						<div class="text-muted-foreground text-xs font-medium uppercase tracking-wide">Net</div>
						<div
							class="mt-1 text-2xl font-bold break-all leading-tight tabular-nums {arcadeNet >= 0
								? 'text-success'
								: 'text-red-600'}"
						>
							{#if arcadeNet >= 0}
								{formatValue(arcadeNet)}
							{:else}
								-{formatValue(Math.abs(arcadeNet))}
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>

		<!-- Achievements -->
		{#if userAchievements.length > 0}
			<Card.Root class="mb-6">
				<Card.Header class="pb-3">
					<div class="flex items-center justify-between">
						<Card.Title class="flex items-center gap-2">
							<HugeiconsIcon icon={Award05Icon} class="h-5 w-5 text-yellow-500" />
							Achievements ({userAchievements.filter((a) => a.unlocked).length}/{userAchievements.length})
						</Card.Title>
						<Button variant="outline" size="sm" onclick={() => goto('/achievements')}>
							View All
						</Button>
					</div>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-wrap gap-2">
						{#each userAchievements as achievement}
							<Tooltip.Root>
								<Tooltip.Trigger>
									<img
										src="/achievements/{achievement.icon}"
										alt={achievement.name}
										class="h-8 w-8 cursor-pointer transition-all {achievement.unlocked ? 'hover:scale-110' : 'brightness-[0.3] grayscale'}"
									/>
								</Tooltip.Trigger>
								<Tooltip.Content
									class="bg-secondary text-secondary-foreground ring-border ring-1"
									arrowClasses="bg-secondary"
								>
									<p class="font-semibold">{achievement.name}</p>
									<p class="text-muted-foreground text-xs">{achievement.description}</p>
									{#if !achievement.unlocked}
										<p class="mt-1 text-xs text-yellow-500">Locked</p>
									{/if}
								</Tooltip.Content>
							</Tooltip.Root>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Created Coins -->
		{#if hasCreatedCoins}
			<Card.Root class="mb-6">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2">
						<HugeiconsIcon icon={Coins01Icon} class="h-5 w-5" />
						Created Coins ({profileData.createdCoins.length})
					</Card.Title>
					<Card.Description>Coins launched by {profileData.profile.name}</Card.Description>
				</Card.Header>
				<Card.Content class="p-0">
					<DataTable
						columns={createdCoinsColumns}
						data={profileData.createdCoins}
						onRowClick={(coin) => goto(`/coin/${coin.symbol}`)}
					/>
				</Card.Content>
			</Card.Root>
		{/if}

		<!-- Recent Trading Activity -->
		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2">
					<HugeiconsIcon icon={Activity01Icon} class="h-5 w-5" />
					Recent Trading Activity
				</Card.Title>
				<Card.Description>Latest transactions by {profileData.profile.name}</Card.Description>
			</Card.Header>
			<Card.Content class="p-0">
				<DataTable
					columns={transactionsColumns}
					data={recentTransactions}
					emptyIcon={Invoice03Icon}
					emptyTitle="No recent activity"
					emptyDescription="This user hasn't made any trades yet."
				/>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
