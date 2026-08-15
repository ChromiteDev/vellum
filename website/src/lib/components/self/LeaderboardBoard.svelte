<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar';
	import UserName from './UserName.svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { CrownIcon } from '@hugeicons/core-free-icons';
	import { getPublicUrl } from '$lib/utils';

	interface Entry {
		userId?: number;
		username: string;
		name?: string;
		image?: string | null;
		nameColor?: string | null;
		founderBadge?: boolean;
		[key: string]: any;
	}

	let {
		entries,
		statLabel,
		formatStat,
		statClass = 'text-foreground font-mono font-semibold',
		accent = 'violet',
		emptyMessage = 'No entries yet',
		onSelect
	}: {
		entries: Entry[];
		statLabel: string;
		formatStat: (entry: Entry) => string;
		statClass?: string;
		accent?: 'violet' | 'gold' | 'silver' | 'bronze' | 'red';
		emptyMessage?: string;
		onSelect?: (entry: Entry) => void;
	} = $props();

	const podiumOrder = [1, 0, 2];
	const topThree = $derived(entries.slice(0, 3));
	const rest = $derived(entries.slice(3));

	const medalStyles: Record<
		number,
		{ card: string; ring: string; rank: string; text: string; size: string }
	> = {
		0: {
			card: 'border-yellow-400/40 bg-gradient-to-b from-yellow-400/12 to-transparent shadow-[0_16px_40px_-20px_rgba(250,204,21,0.35)]',
			ring: 'ring-2 ring-yellow-400/70',
			rank: 'bg-yellow-400 text-yellow-950',
			text: 'text-yellow-300',
			size: 'lg'
		},
		1: {
			card: 'border-slate-300/30 bg-gradient-to-b from-slate-200/10 to-transparent',
			ring: 'ring-2 ring-slate-300/60',
			rank: 'bg-slate-300 text-slate-900',
			text: 'text-slate-200',
			size: 'md'
		},
		2: {
			card: 'border-amber-600/40 bg-gradient-to-b from-amber-600/12 to-transparent',
			ring: 'ring-2 ring-amber-600/60',
			rank: 'bg-amber-600 text-amber-50',
			text: 'text-amber-400',
			size: 'md'
		}
	};

	function handleClick(entry: Entry) {
		onSelect?.(entry);
	}
</script>

{#if entries.length === 0}
	<div class="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
		<div class="text-muted-foreground mb-3 text-sm">{emptyMessage}</div>
	</div>
{:else}
	<div class="space-y-6">
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
			{#each podiumOrder as orderIndex (orderIndex)}
				{@const entry = topThree[orderIndex]}
				{@const style = medalStyles[orderIndex]}
				{#if entry}
					<button
						type="button"
						onclick={() => handleClick(entry)}
						class="group animate-vellum-rise relative flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 {style.card} {orderIndex === 0 ? 'order-2 sm:order-2' : orderIndex === 1 ? 'order-1 sm:order-1' : 'order-3 sm:order-3'}"
						style="animation-delay: {orderIndex * 80}ms"
					>
						{#if orderIndex === 0}
							<div class="absolute -top-3 left-1/2 -translate-x-1/2">
								<HugeiconsIcon icon={CrownIcon} class="h-6 w-6 text-yellow-400 drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)]" />
							</div>
						{/if}
						<div class="text-muted-foreground text-xs font-semibold uppercase tracking-widest">#{orderIndex + 1}</div>
						<Avatar.Root class="{style.ring} {orderIndex === 0 ? 'h-16 w-16' : 'h-14 w-14'} rounded-full">
							<Avatar.Image src={getPublicUrl(entry.image ?? null)} alt={entry.name ?? entry.username} />
							<Avatar.Fallback class="{style.rank} text-base font-bold">{entry.name?.charAt(0) || entry.username.charAt(0)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="flex min-w-0 flex-col items-center gap-1">
							<div class="flex max-w-full items-center gap-1.5">
								<span class="truncate text-sm font-semibold {orderIndex === 0 ? 'text-base' : ''}">
									<UserName name={entry.name ?? entry.username} nameColor={entry.nameColor} />
								</span>
								{#if entry.founderBadge}
									<span class="text-cyan-400">★</span>
								{/if}
							</div>
							<span class="text-muted-foreground max-w-full truncate text-xs">@{entry.username}</span>
							<div class="mt-2 text-lg font-bold tracking-tight {style.text}">{formatStat(entry)}</div>
							<div class="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{statLabel}</div>
						</div>
					</button>
				{:else}
					<div class="rounded-2xl border border-dashed p-5 opacity-40"></div>
				{/if}
			{/each}
		</div>

		{#if rest.length > 0}
			<div class="space-y-2">
				{#each rest as entry, index (entry.userId ?? `${entry.username}-${index}`)}
					<button
						type="button"
						onclick={() => handleClick(entry)}
						class="group animate-vellum-rise hover:border-primary/40 flex w-full items-center gap-4 rounded-xl border bg-background/40 px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-background/70"
						style="animation-delay: {240 + index * 40}ms"
					>
						<div class="text-muted-foreground w-6 text-center font-mono text-sm font-semibold">{index + 4}</div>
						<Avatar.Root class="h-10 w-10 rounded-full">
							<Avatar.Image src={getPublicUrl(entry.image ?? null)} alt={entry.name ?? entry.username} />
							<Avatar.Fallback class="text-xs">{entry.name?.charAt(0) || entry.username.charAt(0)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5">
								<span class="truncate text-sm font-medium">
									<UserName name={entry.name ?? entry.username} nameColor={entry.nameColor} />
								</span>
								{#if entry.founderBadge}
									<span class="text-cyan-400">★</span>
								{/if}
							</div>
							<div class="text-muted-foreground truncate text-xs">@{entry.username}</div>
						</div>
						<div class="text-right">
							<div class="text-sm font-semibold tracking-tight {statClass}">{formatStat(entry)}</div>
							<div class="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">{statLabel}</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
