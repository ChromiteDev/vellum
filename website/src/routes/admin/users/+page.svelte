<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Search01Icon,
		UserGroupIcon,
		LegalHammerIcon,
		Shield01Icon,
		Coins01Icon,
		Award05Icon,
		Cancel01Icon,
		UserCheck01Icon,
		Loading03Icon,
		UserIcon
	} from '@hugeicons/core-free-icons';
	import { toast } from 'svelte-sonner';
	import { USER_DATA } from '$lib/stores/user-data';
	import { formatValue } from '$lib/utils';

	interface ManagedUser {
		id: number;
		name: string;
		username: string;
		email: string;
		bio: string | null;
		isAdmin: boolean;
		isFounder: boolean;
		isBanned: boolean;
		banReason: string | null;
		createdAt: string;
		baseCurrencyBalance: number;
		gems: number;
		nameColor: string | null;
		prestigeLevel: number;
		founderBadge: boolean;
	}

	type FieldKind = 'none' | 'reason' | 'value' | 'value-reason' | 'username-reason' | 'toggle';

	interface Action {
		key: string;
		label: string;
		destructive: boolean;
		field: FieldKind;
		valueKind?: 'text' | 'number';
		valueLabel?: string;
		valuePlaceholder?: string;
		toggleValue?: boolean;
		toggleLabel?: string;
	}

	let query = $state('');
	let users = $state<ManagedUser[]>([]);
	let loading = $state(false);
	let selected = $state<ManagedUser | null>(null);
	let actionLoading = $state(false);

	let dialogOpen = $state(false);
	let pendingAction = $state<Action | null>(null);
	let reason = $state('');
	let value = $state('');
	let newUsername = $state('');

	let isFounder = $derived($USER_DATA?.isFounder ?? false);

	function fmtMoney(n: number): string {
		return '$' + Math.round(n).toLocaleString('en-US');
	}

	function buildActions(u: ManagedUser): Action[] {
		const moderation: Action[] = [
			u.isBanned
				? { key: 'unban', label: 'Unban', destructive: false, field: 'none' }
				: { key: 'ban', label: 'Ban', destructive: true, field: 'reason' },
			{ key: 'change_username', label: 'Change username', destructive: false, field: 'username-reason' },
			{ key: 'set_name_color', label: 'Set name color', destructive: false, field: 'value', valueKind: 'text', valueLabel: 'Name color', valuePlaceholder: 'e.g. violet or #ff00ff' },
			{ key: 'clear_name_color', label: 'Clear name color', destructive: true, field: 'reason' },
			{ key: 'clear_bio', label: 'Clear bio', destructive: true, field: 'reason' },
			{ key: 'clear_banner', label: 'Clear banner', destructive: true, field: 'reason' },
			{ key: 'clear_song', label: 'Clear song', destructive: true, field: 'reason' },
			{ key: 'force_logout', label: 'Force logout', destructive: true, field: 'reason' },
		];

		const god: Action[] = [
			{ key: 'set_admin', label: u.isAdmin ? 'Demote from admin' : 'Promote to admin', destructive: u.isAdmin, field: 'toggle', toggleValue: !u.isAdmin, toggleLabel: u.isAdmin ? 'Remove admin role' : 'Grant admin role' },
			{ key: 'set_founder', label: u.isFounder ? 'Demote from founder' : 'Promote to founder', destructive: u.isFounder, field: 'toggle', toggleValue: !u.isFounder, toggleLabel: u.isFounder ? 'Remove founder role' : 'Grant founder role' },
			{ key: 'set_prestige', label: 'Set prestige', destructive: false, field: 'value', valueKind: 'number', valueLabel: 'Prestige level', valuePlaceholder: '0-1000' },
			{ key: 'set_balance', label: 'Set balance', destructive: false, field: 'value', valueKind: 'number', valueLabel: 'Balance ($)', valuePlaceholder: 'e.g. 1000' },
			{ key: 'set_gems', label: 'Set gems', destructive: false, field: 'value', valueKind: 'number', valueLabel: 'Gems', valuePlaceholder: 'e.g. 100' },
			{ key: u.founderBadge ? 'remove_badge' : 'grant_badge', label: u.founderBadge ? 'Remove founder badge' : 'Grant founder badge', destructive: u.founderBadge, field: 'none' },
			{ key: 'delete_account', label: 'Delete account', destructive: true, field: 'reason' },
		];

		return isFounder ? [...moderation, ...god] : moderation;
	}

	let actions = $derived(selected ? buildActions(selected) : []);

	async function loadUsers(q: string) {
		loading = true;
		try {
			const url = q.trim() ? `/api/admin/users?q=${encodeURIComponent(q.trim())}` : '/api/admin/users';
			const res = await fetch(url);
			if (res.ok) {
				const json = await res.json();
				users = json.users ?? [];
			} else {
				toast.error('Failed to load users');
			}
		} catch {
			toast.error('Failed to load users');
		} finally {
			loading = false;
		}
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => loadUsers(query), 250);
	});

	onMount(() => {
		loadUsers('');
	});

	function selectUser(u: ManagedUser) {
		selected = u;
	}

	function openAction(a: Action) {
		reason = '';
		value = '';
		newUsername = '';
		pendingAction = a;
		dialogOpen = true;
	}

	function dialogTitle(a: Action): string {
		return a.label;
	}

	function canConfirm(): boolean {
		if (!pendingAction) return false;
		switch (pendingAction.field) {
			case 'reason':
				return reason.trim().length > 0;
			case 'value':
				return value.trim().length > 0;
			case 'value-reason':
				return value.trim().length > 0 && reason.trim().length > 0;
			case 'username-reason':
				return newUsername.trim().length >= 3 && reason.trim().length > 0;
			case 'toggle':
			case 'none':
				return true;
		}
	}

	async function confirmAction() {
		if (!pendingAction || !selected || actionLoading) return;
		const target = selected;
		const action = pendingAction;
		actionLoading = true;
		try {
			const body: Record<string, unknown> = {
				action: action.key,
				username: target.username,
			};
			if (action.field === 'reason' || action.field === 'value-reason' || action.field === 'username-reason') {
				body.reason = reason.trim();
			}
			if (action.field === 'username-reason') {
				body.newUsername = newUsername.trim();
			}
			if (action.field === 'value' || action.field === 'value-reason') {
				body.value = action.valueKind === 'number' ? Number(value) : value.trim();
			}
			if (action.field === 'toggle') {
				body.value = action.toggleValue;
			}

			const res = await fetch('/api/admin/users/manage', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (res.ok) {
				toast.success(`${action.label} applied to @${target.username}`);
				dialogOpen = false;
				pendingAction = null;
				await loadUsers(query);
				const refreshed = users.find((u) => u.id === target.id);
				selected = refreshed ?? target;
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || json.error || 'Action failed');
			}
		} catch {
			toast.error('Action failed');
		} finally {
			actionLoading = false;
		}
	}
</script>

<svelte:head>
	<title>User Management | Vellum</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !$USER_DATA || !$USER_DATA.isAdmin}
	<div class="flex h-screen items-center justify-center">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Access Denied</h1>
			<p class="text-muted-foreground">You don't have permission to access this page.</p>
		</div>
	</div>
{:else}
	<div class="container mx-auto max-w-6xl space-y-4 p-4 pb-16">
		<div class="flex flex-wrap items-center gap-3">
			<div class="bg-primary/10 text-primary flex h-11 w-11 items-center justify-center rounded-xl">
				<HugeiconsIcon icon={UserGroupIcon} class="h-6 w-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold">User Management</h1>
				<p class="text-muted-foreground text-sm">
					Moderation, identity, and account controls.
					{#if isFounder}God controls unlocked.{/if}
				</p>
			</div>
			<Badge variant="outline" class="ml-auto">{isFounder ? 'Founder' : 'Admin'}</Badge>
		</div>

		<div class="relative">
			<HugeiconsIcon
				icon={Search01Icon}
				class="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
			/>
			<Input
				placeholder="Search by username or name"
				bind:value={query}
				class="h-10 pl-9"
			/>
		</div>

		<div class="grid gap-4 lg:grid-cols-2">
			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Title class="flex items-center gap-2 text-base">
						<HugeiconsIcon icon={UserGroupIcon} class="h-4 w-4" />
						Users ({users.length})
					</Card.Title>
				</Card.Header>
				<Card.Content class="max-h-[560px] overflow-y-auto p-2">
					{#if loading}
						<div class="space-y-2 p-2">
							{#each Array(6) as _}
								<Skeleton class="h-14 w-full" />
							{/each}
						</div>
					{:else if users.length === 0}
						<div class="text-muted-foreground py-10 text-center text-sm">No users found.</div>
					{:else}
						<div class="space-y-1">
							{#each users as u (u.id)}
								<button
									type="button"
									onclick={() => selectUser(u)}
									class="hover:bg-muted flex w-full items-center gap-3 rounded-lg p-2 text-left {selected?.id === u.id ? 'bg-muted' : ''}"
								>
									<div class="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
										{u.name.charAt(0).toUpperCase()}
									</div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-2">
											<span class="truncate text-sm font-medium">@{u.username}</span>
											{#if u.isFounder}
												<Badge variant="outline" class="text-primary shrink-0">Founder</Badge>
											{:else if u.isAdmin}
												<Badge variant="outline" class="shrink-0">Admin</Badge>
											{/if}
											{#if u.isBanned}
												<Badge variant="destructive" class="shrink-0">Banned</Badge>
											{/if}
										</div>
										<div class="text-muted-foreground truncate text-xs">
											{u.name} · {fmtMoney(u.baseCurrencyBalance)} · {u.gems.toLocaleString()} gems
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="pb-2">
					<Card.Title class="flex items-center gap-2 text-base">
						<HugeiconsIcon icon={LegalHammerIcon} class="h-4 w-4" />
						Actions
					</Card.Title>
				</Card.Header>
				<Card.Content class="max-h-[560px] overflow-y-auto">
					{#if !selected}
						<div class="text-muted-foreground py-10 text-center text-sm">
							Select a user to manage them.
						</div>
					{:else}
						<div class="mb-3 rounded-lg border p-3">
							<div class="flex items-center gap-2">
								<span class="font-semibold">@{selected.username}</span>
								{#if selected.isFounder}
									<Badge variant="outline" class="text-primary">Founder</Badge>
								{:else if selected.isAdmin}
									<Badge variant="outline">Admin</Badge>
								{/if}
								{#if selected.isBanned}
									<Badge variant="destructive">Banned</Badge>
								{/if}
							</div>
							<div class="text-muted-foreground mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
								<span>Cash: {fmtMoney(selected.baseCurrencyBalance)}</span>
								<span>Gems: {selected.gems.toLocaleString()}</span>
								<span>Prestige: {selected.prestigeLevel}</span>
								<span>Badge: {selected.founderBadge ? 'Yes' : 'No'}</span>
								<span>Name color: {selected.nameColor ?? 'None'}</span>
								<span>Bio: {selected.bio ? 'Set' : 'Empty'}</span>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-2">
							{#each actions as a (a.key)}
								<Button
									variant={a.destructive ? 'destructive' : 'outline'}
									size="sm"
									onclick={() => openAction(a)}
									class="justify-start"
								>
									<HugeiconsIcon icon={a.destructive ? Cancel01Icon : a.key === 'set_admin' || a.key === 'set_founder' ? Shield01Icon : a.key === 'set_balance' || a.key === 'set_gems' ? Coins01Icon : a.key === 'set_prestige' ? Award05Icon : UserIcon} class="h-4 w-4" />
									<span class="truncate">{a.label}</span>
								</Button>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{/if}

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class={pendingAction?.destructive ? 'text-destructive' : ''}>
				{dialogTitle(pendingAction ?? { key: '', label: '', destructive: false, field: 'none' })}
			</Dialog.Title>
			<Dialog.Description>
				{#if selected}
					Apply to <span class="font-semibold">@{selected.username}</span>. Every action is recorded in the audit trail.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			{#if pendingAction?.field === 'username-reason'}
				<div class="space-y-1">
					<Label for="new-username">New username</Label>
					<Input id="new-username" bind:value={newUsername} placeholder="new_username" maxlength={30} />
				</div>
			{/if}

			{#if pendingAction?.field === 'value' || pendingAction?.field === 'value-reason'}
				<div class="space-y-1">
					<Label for="action-value">{pendingAction?.valueLabel ?? 'Value'}</Label>
					<Input
						id="action-value"
						type={pendingAction?.valueKind === 'number' ? 'number' : 'text'}
						bind:value={value}
						placeholder={pendingAction?.valuePlaceholder ?? ''}
					/>
				</div>
			{/if}

			{#if pendingAction?.field === 'toggle' && pendingAction?.toggleLabel}
				<div class="text-sm">
					{pendingAction.toggleValue ? 'Granting' : 'Removing'}: {pendingAction.toggleLabel}
				</div>
			{/if}

			{#if pendingAction?.field === 'reason' || pendingAction?.field === 'value-reason' || pendingAction?.field === 'username-reason'}
				<div class="space-y-1">
					<Label for="action-reason">Reason</Label>
					<Textarea id="action-reason" bind:value={reason} placeholder="Why is this action being taken?" class="min-h-20" />
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
			<Button
				variant={pendingAction?.destructive ? 'destructive' : 'default'}
				onclick={confirmAction}
				disabled={!canConfirm() || actionLoading}
			>
				{#if actionLoading}
					<HugeiconsIcon icon={Loading03Icon} class="h-4 w-4 animate-spin" />
					Applying…
				{:else}
					Confirm
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
