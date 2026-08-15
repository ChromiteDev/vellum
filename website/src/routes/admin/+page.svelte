<script lang="ts">
	import { USER_DATA } from '$lib/stores/user-data';
	import * as Card from '$lib/components/ui/card';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Shield01Icon,
		LegalHammerIcon,
		Ticket01Icon
	} from '@hugeicons/core-free-icons';
</script>

<svelte:head>
	<title>Admin | Vellum</title>
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
	<div class="container mx-auto max-w-4xl space-y-4 p-4">
		<div>
			<h1 class="flex items-center gap-2 text-2xl font-bold">
				<HugeiconsIcon icon={Shield01Icon} class="h-6 w-6 text-primary" />
				Admin Panel
			</h1>
			<p class="text-muted-foreground text-sm">Manage users and promo codes.</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<a href="/admin/users" class="block">
				<Card.Root class="h-full transition-colors hover:border-primary">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<HugeiconsIcon icon={LegalHammerIcon} class="h-5 w-5 text-primary" />
							User Management
						</Card.Title>
						<Card.Description>Ban, rename, and moderate users. Founders get god controls.</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>

			<a href="/admin/promo" class="block">
				<Card.Root class="h-full transition-colors hover:border-primary">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<HugeiconsIcon icon={Ticket01Icon} class="h-5 w-5 text-primary" />
							Promo Codes
						</Card.Title>
						<Card.Description>Create and manage promo codes.</Card.Description>
					</Card.Header>
				</Card.Root>
			</a>
		</div>
	</div>
{/if}
