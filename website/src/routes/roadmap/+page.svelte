<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import SEO from '$lib/components/self/SEO.svelte';
	import { USER_DATA } from '$lib/stores/user-data';
	import { toast } from 'svelte-sonner';
	import { haptic } from '$lib/stores/haptics';
	import { Lightbulb, ChevronUp, MessageSquare, Plus, Reply } from 'lucide-svelte';

	interface FeatureRequest {
		id: number;
		title: string;
		description: string;
		category: string;
		status: string;
		voteCount: number;
		devResponse: string | null;
		devRespondedAt: string | null;
		createdAt: string;
		creatorUsername: string;
		creatorName: string;
		userVoted: boolean;
	}

	const STATUS_META: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' | 'success'; className: string }> = {
		under_review: { label: 'Under review', variant: 'outline', className: '' },
		planned: { label: 'Planned', variant: 'secondary', className: '' },
		in_development: { label: 'In development', variant: 'outline', className: 'text-blue-400 border-blue-400/40' },
		testing: { label: 'Testing', variant: 'outline', className: 'text-yellow-500 border-yellow-500/40' },
		released: { label: 'Released', variant: 'success', className: '' },
		declined: { label: 'Declined', variant: 'destructive', className: '' },
	};

	const STATUS_OPTIONS = ['under_review', 'planned', 'in_development', 'testing', 'released', 'declined'];
	const CATEGORIES = ['General', 'Trading', 'Arcade', 'Marketplace', 'Profiles', 'Community', 'Economy', 'Other'];

	const GROUPS: { key: string; label: string; description: string; statuses: string[] }[] = [
		{ key: 'released', label: 'Recently released', description: 'Shipped and live right now.', statuses: ['released'] },
		{ key: 'building', label: 'Building', description: 'In active development or testing.', statuses: ['in_development', 'testing'] },
		{ key: 'planned', label: 'Planned', description: 'On the schedule.', statuses: ['planned'] },
		{ key: 'review', label: 'Under review', description: 'The team is looking at these.', statuses: ['under_review'] },
		{ key: 'declined', label: 'Declined', description: 'Considered and set aside.', statuses: ['declined'] },
	];

	let requests = $state<FeatureRequest[]>([]);
	let loading = $state(true);

	let createOpen = $state(false);
	let title = $state('');
	let description = $state('');
	let category = $state('General');
	let submitting = $state(false);

	let votingId = $state<number | null>(null);
	let replyingId = $state<number | null>(null);
	let replyText = $state('');
	let savingReply = $state(false);

	let isAdmin = $derived($USER_DATA?.isAdmin ?? false);

	let totalVotes = $derived(requests.reduce((sum, r) => sum + r.voteCount, 0));
	let releasedCount = $derived(requests.filter((r) => r.status === 'released').length);

	async function load() {
		loading = true;
		try {
			const res = await fetch('/api/roadmap');
			if (res.ok) {
				const json = await res.json();
				requests = json.requests ?? [];
			} else {
				toast.error('Failed to load roadmap');
			}
		} catch {
			toast.error('Failed to load roadmap');
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function inGroup(statuses: string[]) {
		return requests.filter((r) => statuses.includes(r.status));
	}

	async function toggleVote(r: FeatureRequest) {
		if (!$USER_DATA) {
			toast.error('Sign in to vote');
			return;
		}
		if (votingId !== null) return;
		votingId = r.id;
		try {
			const res = await fetch(`/api/roadmap/${r.id}/vote`, { method: 'POST' });
			if (res.ok) {
				const json = await res.json();
				r.userVoted = json.voted;
				r.voteCount = json.voteCount;
				requests = [...requests];
				haptic.trigger('light');
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || json.error || 'Vote failed');
			}
		} catch {
			toast.error('Vote failed');
		} finally {
			votingId = null;
		}
	}

	function openCreate() {
		if (!$USER_DATA) {
			toast.error('Sign in to request a feature');
			return;
		}
		title = '';
		description = '';
		category = 'General';
		createOpen = true;
	}

	async function createRequest() {
		if (submitting) return;
		submitting = true;
		try {
			const res = await fetch('/api/roadmap', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim(), description: description.trim(), category }),
			});
			if (res.ok) {
				toast.success('Feature request submitted');
				createOpen = false;
				await load();
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || json.error || 'Failed to submit');
			}
		} catch {
			toast.error('Failed to submit');
		} finally {
			submitting = false;
		}
	}

	async function setStatus(r: FeatureRequest, status: string) {
		try {
			const res = await fetch(`/api/roadmap/${r.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status }),
			});
			if (res.ok) {
				r.status = status;
				requests = [...requests];
				haptic.trigger('success');
				toast.success('Status updated');
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || json.error || 'Update failed');
			}
		} catch {
			toast.error('Update failed');
		}
	}

	function openReply(r: FeatureRequest) {
		replyingId = r.id;
		replyText = r.devResponse ?? '';
	}

	async function saveReply(r: FeatureRequest) {
		if (savingReply) return;
		savingReply = true;
		try {
			const res = await fetch(`/api/roadmap/${r.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status: r.status,
					devResponse: replyText.trim(),
					clearResponse: replyText.trim().length === 0,
				}),
			});
			if (res.ok) {
				await load();
				toast.success('Response saved');
			} else {
				const json = await res.json().catch(() => ({}));
				toast.error(json.message || json.error || 'Update failed');
			}
		} catch {
			toast.error('Update failed');
		} finally {
			savingReply = false;
			replyingId = null;
		}
	}

	function statusMeta(status: string) {
		return STATUS_META[status] ?? { label: status, variant: 'outline' as const, className: '' };
	}

	function timeAgo(date: string): string {
		const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
		if (seconds < 60) return 'just now';
		const mins = Math.floor(seconds / 60);
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 30) return `${days}d ago`;
		return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<SEO
	title="Roadmap - Vellum"
	description="See what the Vellum team is building and vote on the features you want next."
	keywords="vellum roadmap, feature requests, community voting, changelog"
/>

<div class="container mx-auto max-w-5xl p-4 pb-16 md:p-6">
	<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl">
				<Lightbulb class="text-primary h-6 w-6" />
				Roadmap
			</h1>
			<p class="text-muted-foreground mt-1 text-sm md:text-base">
				The community decides what gets built. Vote on what matters most.
			</p>
		</div>
		<Button onclick={openCreate} class="shrink-0">
			<Plus class="h-4 w-4" />
			Request a feature
		</Button>
	</header>

	<div class="mb-6 grid grid-cols-3 gap-3">
		<Card.Root>
			<Card.Content class="py-4 text-center">
				<div class="text-2xl font-bold tabular-nums">{requests.length}</div>
				<div class="text-muted-foreground text-xs">Requests</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="py-4 text-center">
				<div class="text-2xl font-bold tabular-nums">{totalVotes}</div>
				<div class="text-muted-foreground text-xs">Votes</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="py-4 text-center">
				<div class="text-2xl font-bold tabular-nums">{releasedCount}</div>
				<div class="text-muted-foreground text-xs">Shipped</div>
			</Card.Content>
		</Card.Root>
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each Array(4) as _}
				<Skeleton class="h-24 w-full" />
			{/each}
		</div>
	{:else if requests.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
			<Lightbulb class="text-muted-foreground mb-3 h-10 w-10" />
			<p class="text-muted-foreground text-sm">No requests yet. Be the first to shape Vellum.</p>
			<Button onclick={openCreate} class="mt-4">
				<Plus class="h-4 w-4" />
				Request a feature
			</Button>
		</div>
	{:else}
		<div class="space-y-8">
			{#each GROUPS as group (group.key)}
				{@const items = inGroup(group.statuses)}
				{#if items.length > 0}
					<section>
						<div class="mb-3">
							<h2 class="text-lg font-semibold">{group.label}</h2>
							<p class="text-muted-foreground text-sm">{group.description}</p>
						</div>
						<div class="space-y-3">
							{#each items as r (r.id)}
								<Card.Root class="min-w-0">
									<Card.Content class="p-4">
										<div class="flex items-start gap-3">
											<button
												type="button"
												onclick={() => toggleVote(r)}
												disabled={votingId !== null}
												class="flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 transition-colors {r.userVoted
													? 'border-primary/50 bg-primary/10 text-primary'
													: 'text-muted-foreground hover:border-primary/30 hover:text-foreground'}"
											>
												<ChevronUp class="h-4 w-4" />
												<span class="text-sm font-semibold tabular-nums">{r.voteCount}</span>
											</button>

											<div class="min-w-0 flex-1">
												<div class="flex flex-wrap items-center gap-2">
													<h3 class="text-base font-semibold">{r.title}</h3>
													<Badge variant="outline" class="text-xs">{r.category}</Badge>
													<Badge variant={statusMeta(r.status).variant} class={statusMeta(r.status).className}>{statusMeta(r.status).label}</Badge>
												</div>
												<p class="text-muted-foreground mt-1.5 whitespace-pre-line text-sm">{r.description}</p>
												<div class="text-muted-foreground mt-2 text-xs">
													by <span class="font-medium">@{r.creatorUsername}</span> · {timeAgo(r.createdAt)}
												</div>

												{#if r.devResponse}
													<div class="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
														<div class="flex items-center gap-1.5 text-xs font-semibold text-primary">
															<MessageSquare class="h-3.5 w-3.5" />
															Vellum team
														</div>
														<p class="mt-1 whitespace-pre-line text-sm">{r.devResponse}</p>
													</div>
												{/if}

												{#if isAdmin}
													<div class="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
														<select
															value={r.status}
															onchange={(e) => setStatus(r, e.currentTarget.value)}
															class="bg-background h-8 rounded-md border px-2 text-xs"
														>
															{#each STATUS_OPTIONS as s}
																<option value={s} selected={s === r.status}>{STATUS_META[s]?.label ?? s}</option>
															{/each}
														</select>
														<Button variant="outline" size="sm" onclick={() => openReply(r)}>
															<Reply class="h-3.5 w-3.5" />
															{r.devResponse ? 'Edit response' : 'Respond'}
														</Button>
													</div>
												{/if}

												{#if isAdmin && replyingId === r.id}
													<div class="mt-3 space-y-2">
														<Textarea bind:value={replyText} placeholder="Share an update with the community…" class="min-h-20 text-sm" />
														<div class="flex justify-end gap-2">
															<Button variant="ghost" size="sm" onclick={() => (replyingId = null)}>Cancel</Button>
															<Button size="sm" onclick={() => saveReply(r)} disabled={savingReply}>
																{savingReply ? 'Saving…' : 'Save response'}
															</Button>
														</div>
													</div>
												{/if}
											</div>
										</div>
									</Card.Content>
								</Card.Root>
							{/each}
						</div>
					</section>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<Dialog.Root bind:open={createOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Request a feature</Dialog.Title>
			<Dialog.Description>
				Describe what you want and the community can vote it up.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="space-y-1">
				<Label for="fr-title">Title</Label>
				<Input id="fr-title" bind:value={title} placeholder="e.g. Price alerts for my coins" maxlength={120} />
			</div>
			<div class="space-y-1">
				<Label for="fr-category">Category</Label>
				<select id="fr-category" bind:value={category} class="bg-background h-9 w-full rounded-md border px-2 text-sm">
					{#each CATEGORIES as c}
						<option value={c}>{c}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-1">
				<Label for="fr-description">Description</Label>
				<Textarea id="fr-description" bind:value={description} placeholder="What should it do and why?" class="min-h-24" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (createOpen = false)}>Cancel</Button>
			<Button
				onclick={createRequest}
				disabled={submitting || title.trim().length < 4 || description.trim().length < 10}
			>
				{submitting ? 'Submitting…' : 'Submit'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
