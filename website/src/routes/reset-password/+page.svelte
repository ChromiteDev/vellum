<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { client } from '$lib/auth-client';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import SEO from '$lib/components/self/SEO.svelte';
	import { KeyRound } from 'lucide-svelte';

	const token = $derived(page.url.searchParams.get('token') ?? '');

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let done = $state(false);
	let error = $state('');

	function friendlyMessage(message?: string): string {
		if (!message) return 'Something went wrong. Please try again.';
		const m = message.toLowerCase();
		if (m.includes('token') || m.includes('expired')) {
			return 'This link is invalid or has expired. Request a new one.';
		}
		if (m.includes('too short') || m.includes('password')) return 'Password must be at least 8 characters.';
		return message;
	}

	async function submit() {
		if (loading) return;
		error = '';
		if (!token) {
			error = 'This link is invalid or has expired.';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters.';
			return;
		}
		if (password !== confirm) {
			error = 'Passwords do not match.';
			return;
		}
		loading = true;
		try {
			const res = await client.resetPassword({
				newPassword: password,
				token
			});
			if (res.error) {
				error = friendlyMessage(res.error.message);
				return;
			}
			done = true;
			toast.success('Password updated. You can sign in now.');
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<SEO
	title="Reset password - Vellum"
	description="Set a new password for your Vellum account."
	keywords="vellum, reset password, account security"
/>

<div class="flex min-h-[70vh] items-start justify-center pt-8 md:pt-16">
	<div class="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm md:p-8">
		<div class="mb-6 flex flex-col items-center text-center">
			<div class="bg-primary/10 text-primary mb-3 flex h-12 w-12 items-center justify-center rounded-xl">
				<KeyRound class="h-6 w-6" />
			</div>
			<h1 class="text-xl font-bold tracking-tight">Reset your password</h1>
			<p class="text-muted-foreground mt-1 text-sm">
				{done
					? 'Your password has been updated.'
					: 'Choose a new password for your account.'}
			</p>
		</div>

		{#if done}
			<div class="flex flex-col items-center gap-4">
				<div class="text-primary flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
					<svg class="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 6 9 17l-5-5" />
					</svg>
				</div>
				<p class="text-muted-foreground text-center text-sm">
					Sign in with your new password to continue.
				</p>
				<Button class="w-full" onclick={() => goto('/')}>Back to Vellum</Button>
			</div>
		{:else if !token}
			<div class="flex flex-col items-center gap-4">
				<p class="text-muted-foreground text-center text-sm">
					This link is invalid or has expired. Request a new one from the sign-in screen.
				</p>
				<Button class="w-full" variant="outline" onclick={() => goto('/')}>Back to Vellum</Button>
			</div>
		{:else}
			<form class="flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); submit(); }}>
				<div class="space-y-1.5">
					<Label for="reset-password">New password</Label>
					<Input
						id="reset-password"
						type="password"
						bind:value={password}
						placeholder="At least 8 characters"
						autocomplete="new-password"
					/>
				</div>
				<div class="space-y-1.5">
					<Label for="reset-confirm">Confirm password</Label>
					<Input
						id="reset-confirm"
						type="password"
						bind:value={confirm}
						placeholder="Re-enter your password"
						autocomplete="new-password"
					/>
				</div>

				{#if error}
					<p class="text-destructive text-sm font-medium" role="alert">{error}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'Updating…' : 'Update password'}
				</Button>
			</form>
		{/if}
	</div>
</div>
