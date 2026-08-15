<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Dialog from '$lib/components/ui/dialog';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Shield01Icon,
		Coins01Icon,
		Loading03Icon,
		LegalHammerIcon,
		Award05Icon
	} from '@hugeicons/core-free-icons';
	import { USER_DATA } from '$lib/stores/user-data';
	import { formatValue } from '$lib/utils';
	import { goto } from '$app/navigation';

	interface OverviewStats {
		totalUsers: number;
		activeUsers24h: number;
		newUsers7d: number;
		bannedUsers: number;
		totalCurrency: number;
		totalGems: number;
		volume24h: number;
		totalCoins: number;
		totalMarketCap: number;
		totalCoinVolume24h: number;
		totalTransactions: number;
		totalArcadeWagered: number;
		totalArcadeGames: number;
		totalCratesOpened: number;
		topHolders: TopHolder[];
	}

	interface TopHolder {
		id: number;
		username: string;
		name: string;
		image: string;
		nameColor: string | null;
		founderBadge: boolean;
		balance: number;
		gems: number;
	}

	interface AuditEntry {
		id: number;
		action: string;
		admin: string;
		target: string | null;
		currency: string | null;
		amount: string | null;
		previousValue: string | null;
		newValue: string | null;
		reason: string | null;
		createdAt: string;
	}

	interface SearchUser {
		id: number;
		username: string;
		name: string;
		isAdmin: boolean;
		isFounder: boolean;
		baseCurrencyBalance: number;
		gems: number;
	}

	let overview = $state<OverviewStats | null>(null);
	let topHolders = $state<TopHolder[]>([]);
	let auditLogs = $state<AuditEntry[]>([]);
	let loadingOverview = $state(true);
	let loadingAudit = $state(true);

	let searchQuery = $state('');
	let searchResults = $state<SearchUser[]>([]);
	let searching = $state(false);
	let selectedUser = $state<SearchUser | null>(null);

	let assetType = $state<'currency' | 'gems'>('currency');
	let actionType = $state<'grant' | 'remove'>('grant');
	let amount = $state('');
	let reason = $state('');

	let submitting = $state(false);
	let confirmOpen = $state(false);
	let resultMessage = $state('');
	let resultSuccess = $state(false);
	let hasResult = $state(false);

	const assetOptions = [
		{ value: 'currency', label: 'Currency ($)' },
		{ value: 'gems', label: 'Gems' }
	];

	const actionOptions = [
		{ value: 'grant', label: 'Grant' },
		{ value: 'remove', label: 'Remove' }
	];

	let assetTypeLabel = $derived(
		assetOptions.find((o) => o.value === assetType)?.label ?? 'Currency ($)'
	);
	let actionTypeLabel = $derived(
		actionOptions.find((o) => o.value === actionType)?.label ?? 'Grant'
	);

	function fmtMoney(value: number): string {
		return '$' + Math.round(value).toLocaleString('en-US');
	}

	function fmtAmount(value: string | null): string {
		if (value == null) return '-';
		const n = Number(value);
		return Number.isInteger(n) ? n.toLocaleString('en-US') : n.toFixed(2);
	}

	async function loadOverview() {
		loadingOverview = true;
		try {
			const response = await fetch('/api/founder/overview');
			if (response.ok) {
				const data = await response.json();
				overview = data;
				topHolders = data.topHolders ?? [];
			}
		} catch (e) {
			console.error('Failed to load founder overview', e);
		} finally {
			loadingOverview = false;
		}
	}

	async function loadAudit() {
		loadingAudit = true;
		try {
			const response = await fetch('/api/founder/audit');
			if (response.ok) {
				const json = await response.json();
				auditLogs = json.logs;
			}
		} catch (e) {
			console.error('Failed to load audit log', e);
		} finally {
			loadingAudit = false;
		}
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}
		searching = true;
		clearTimeout(searchTimer);
		searchTimer = setTimeout(async () => {
			try {
				const response = await fetch(`/api/founder/users?q=${encodeURIComponent(searchQuery.trim())}`);
				if (response.ok) {
					const json = await response.json();
					searchResults = json.users;
				}
			} catch (e) {
				console.error('User search failed', e);
			} finally {
				searching = false;
			}
		}, 300);
	});

	function selectUser(u: SearchUser) {
		selectedUser = u;
		searchResults = [];
		searchQuery = '';
	}

	let canSubmit = $derived(
		!!selectedUser && Number(amount) > 0 && reason.trim().length > 0 && !submitting
	);

	function openConfirm() {
		if (!canSubmit) return;
		confirmOpen = true;
	}

	async function submitEconomyAction() {
		if (!selectedUser) return;
		submitting = true;
		hasResult = false;
		confirmOpen = false;
		try {
			const response = await fetch('/api/founder/economy', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUser.id,
					type: assetType,
					action: actionType,
					amount: Number(amount),
					reason: reason.trim()
				})
			});
			const json = await response.json();
			resultSuccess = response.ok;
			resultMessage = response.ok
				? `${actionTypeLabel}ed ${fmtAmount(String(Number(amount)))} ${assetTypeLabel} ${actionType === 'grant' ? 'to' : 'from'} @${selectedUser.username}`
				: json.error || 'Economy action failed';
			hasResult = true;
			if (response.ok) {
				amount = '';
				reason = '';
				selectedUser = null;
				await Promise.all([loadOverview(), loadAudit()]);
			}
		} catch (e) {
			resultSuccess = false;
			resultMessage = 'Economy action failed';
			hasResult = true;
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if ($USER_DATA?.isFounder) {
			loadOverview();
			loadAudit();
		}
	});
</script>

<svelte:head>
	<title>Founder | Vellum</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$USER_DATA || !$USER_DATA.isFounder}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Access Denied</h1>
			<p class="text-muted-foreground">Founder access is required for this area.</p>
		</div>
	</div>
{:else}
	<div class="container mx-auto space-y-6 p-4 pb-16">
		<div class="flex flex-wrap items-center gap-3">
			<div class="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
				<HugeiconsIcon icon={Shield01Icon} class="h-6 w-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold">Founder Command Center</h1>
				<p class="text-muted-foreground text-sm">Platform health, economy controls, and audit trail.</p>
			</div>
			<Button variant="outline" size="sm" class="ml-auto" onclick={() => goto('/admin/users')}>
				<HugeiconsIcon icon={LegalHammerIcon} class="h-4 w-4" />
				User Management
			</Button>
			<Badge variant="outline" class="border-primary/40 text-primary">Founder</Badge>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Total Users</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{overview?.totalUsers.toLocaleString() ?? 0}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Active (24h)</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{overview?.activeUsers24h.toLocaleString() ?? 0}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">New (7d)</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{overview?.newUsers7d.toLocaleString() ?? 0}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Currency Circulating</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-28" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{fmtMoney(overview?.totalCurrency ?? 0)}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Total Gems</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-28" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{(overview?.totalGems ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Volume (24h)</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-28" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{fmtMoney(overview?.volume24h ?? 0)}</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Total Coins</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-20" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{(overview?.totalCoins ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Market Cap</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold break-all">{formatValue(overview?.totalMarketCap ?? 0)}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Transactions</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{(overview?.totalTransactions ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Banned Users</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-20" />
					{:else}
						<div class="text-destructive mt-1 text-3xl font-bold">{(overview?.bannedUsers ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Arcade Wagered</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold break-all">{formatValue(overview?.totalArcadeWagered ?? 0)}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Arcade Games</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{(overview?.totalArcadeGames ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Crates Opened</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold">{(overview?.totalCratesOpened ?? 0).toLocaleString()}</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardContent class="pt-6">
					<div class="text-muted-foreground text-sm">Coin Volume (24h)</div>
					{#if loadingOverview}
						<Skeleton class="mt-1 h-8 w-24" />
					{:else}
						<div class="mt-1 text-3xl font-bold break-all">{formatValue(overview?.totalCoinVolume24h ?? 0)}</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<Card>
			<CardHeader class="pb-3">
				<CardTitle class="flex items-center gap-2 text-lg">
					<HugeiconsIcon icon={Award05Icon} class="h-5 w-5" />
					Top Holders
				</CardTitle>
				<CardDescription class="text-sm">Users ranked by liquid cash balance.</CardDescription>
			</CardHeader>
			<CardContent class="pt-0">
				{#if loadingOverview}
					<div class="space-y-2">
						{#each Array(5) as _}
							<Skeleton class="h-9 w-full" />
						{/each}
					</div>
				{:else if topHolders.length === 0}
					<div class="text-muted-foreground py-6 text-center text-sm">No holders yet.</div>
				{:else}
					<div class="divide-y">
						{#each topHolders as h, i (h.id)}
							<div class="flex items-center gap-3 py-2">
								<span class="text-muted-foreground w-6 shrink-0 text-center font-mono text-sm">{i + 1}</span>
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<span class="truncate text-sm font-medium">@{h.username}</span>
										{#if h.founderBadge}
											<Badge variant="outline" class="text-primary shrink-0">Founder</Badge>
										{/if}
									</div>
									<div class="text-muted-foreground truncate text-xs">{h.name}</div>
								</div>
								<div class="shrink-0 text-right">
									<div class="text-sm font-semibold tabular-nums">{formatValue(h.balance)}</div>
									<div class="text-muted-foreground text-xs">{h.gems.toLocaleString()} gems</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<div class="grid gap-6 lg:grid-cols-5">
			<Card class="lg:col-span-3">
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-lg">
						<HugeiconsIcon icon={Coins01Icon} class="h-5 w-5" />
						Economy Controls
					</CardTitle>
					<CardDescription class="text-sm">
						Grant or remove currency and gems from any user. Every action is recorded in the audit trail.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						{#if selectedUser}
							<div class="flex items-center justify-between rounded-lg border p-3">
								<div>
									<div class="font-semibold">@{selectedUser.username}</div>
									<div class="text-muted-foreground text-xs">
										{fmtMoney(selectedUser.baseCurrencyBalance)} · {selectedUser.gems} gems
									</div>
								</div>
								<div class="flex gap-2">
									{#if selectedUser.isFounder}
										<Badge variant="outline" class="text-primary">Founder</Badge>
									{/if}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => (selectedUser = null)}
									>
										Change
									</Button>
								</div>
							</div>
						{:else}
							<div class="space-y-1">
								<Label class="text-sm">User</Label>
								<Input
									placeholder="Search by username or name"
									bind:value={searchQuery}
									class="h-9"
								/>
								{#if searching}
									<div class="text-muted-foreground py-2 text-sm">Searching…</div>
								{:else if searchQuery.trim() && searchResults.length === 0}
									<div class="text-muted-foreground py-2 text-sm">No users found.</div>
								{:else if searchResults.length > 0}
									<div class="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
										{#each searchResults as u}
											<button
												type="button"
												class="hover:bg-muted flex w-full items-center justify-between rounded-md px-3 py-2 text-left"
												onclick={() => selectUser(u)}
											>
												<span>
													<span class="font-medium">@{u.username}</span>
													<span class="text-muted-foreground ml-2 text-xs">{u.name}</span>
												</span>
												<span class="text-muted-foreground text-xs">
													{fmtMoney(u.baseCurrencyBalance)}
												</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<div class="grid gap-3 sm:grid-cols-2">
							<div class="space-y-1">
								<Label class="text-sm">Asset</Label>
								<Select.Root type="single" bind:value={assetType}>
									<Select.Trigger class="h-9 w-full">{assetTypeLabel}</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each assetOptions as option}
												<Select.Item value={option.value} label={option.label}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
							<div class="space-y-1">
								<Label class="text-sm">Action</Label>
								<Select.Root type="single" bind:value={actionType}>
									<Select.Trigger class="h-9 w-full">{actionTypeLabel}</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each actionOptions as option}
												<Select.Item value={option.value} label={option.label}>
													{option.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						<div class="space-y-1">
							<Label class="text-sm">Amount</Label>
							<Input
								type="number"
								min="0"
								max={assetType === 'gems' ? '1000000000000000000' : '1000000000000000000'}
								step={assetType === 'gems' ? '1' : '0.01'}
								placeholder={assetType === 'gems' ? '10' : '100.00'}
								bind:value={amount}
								class="h-9"
							/>
							<p class="text-muted-foreground text-xs">Max: 1,000,000,000,000,000,000 (1 quintillion)</p>
						</div>

						<div class="space-y-1">
							<Label class="text-sm">Reason</Label>
							<Textarea
								placeholder="Why is this adjustment being made?"
								bind:value={reason}
								class="min-h-20"
							/>
						</div>

						{#if hasResult}
							<div
								class={`rounded-lg border p-3 text-sm ${resultSuccess ? 'border-green-500/30 bg-green-500/10 text-green-600' : 'border-destructive/30 bg-destructive/10 text-destructive'}`}
							>
								{resultMessage}
							</div>
						{/if}

						<Button
							onclick={openConfirm}
							disabled={!canSubmit}
							class="w-full"
							variant={actionType === 'remove' ? 'destructive' : 'default'}
						>
							{actionTypeLabel} {assetTypeLabel}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card class="lg:col-span-2">
				<CardHeader class="pb-3">
					<CardTitle class="flex items-center gap-2 text-lg">
						<HugeiconsIcon icon={LegalHammerIcon} class="h-5 w-5" />
						Audit Trail
					</CardTitle>
					<CardDescription class="text-sm">Recent administrative actions.</CardDescription>
				</CardHeader>
				<CardContent>
					{#if loadingAudit}
						<div class="space-y-2">
							{#each Array(5) as _}
								<Skeleton class="h-9 w-full" />
							{/each}
						</div>
					{:else if auditLogs.length === 0}
						<div class="text-muted-foreground py-8 text-center text-sm">
							No administrative actions recorded yet.
						</div>
					{:else}
						<div class="max-h-96 space-y-2 overflow-y-auto">
							{#each auditLogs as log}
								<div class="rounded-lg border p-3 text-sm">
									<div class="flex items-center justify-between gap-2">
										<span class="font-mono text-xs font-semibold uppercase">{log.action}</span>
										<span class="text-muted-foreground text-xs">
											{new Date(log.createdAt).toLocaleString()}
										</span>
									</div>
									<div class="text-muted-foreground mt-1 text-xs">
										{log.admin}
										{#if log.target} → @{log.target}{/if}
										{#if log.amount && log.currency}
											· {log.currency === 'gems' ? '' : '$'}{fmtAmount(log.amount)}
											{log.currency === 'gems' ? ' gems' : ''}
										{/if}
									</div>
									{#if log.reason}
										<div class="text-muted-foreground mt-1 text-xs italic">"{log.reason}"</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	</div>
{/if}

<Dialog.Root bind:open={confirmOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Confirm economy action</Dialog.Title>
			<Dialog.Description>
				{#if selectedUser}
					You are about to {actionTypeLabel.toLowerCase()} {fmtAmount(String(Number(amount)))} {assetTypeLabel.toLowerCase()}
					{actionType === 'grant' ? ' to ' : ' from '} @{selectedUser.username}. This is recorded
					permanently in the audit trail.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (confirmOpen = false)}>Cancel</Button>
			<Button
				variant={actionType === 'remove' ? 'destructive' : 'default'}
				onclick={submitEconomyAction}
				disabled={submitting}
			>
				{#if submitting}
					<HugeiconsIcon icon={Loading03Icon} class="h-4 w-4 animate-spin" />
					Applying…
				{:else}
					Confirm
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
