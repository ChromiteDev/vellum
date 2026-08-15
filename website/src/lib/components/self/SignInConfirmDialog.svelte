<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { client, signIn, signUp } from '$lib/auth-client';
	import { page } from '$app/state';
	import { env as publicEnv } from '$env/dynamic/public';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { open = $bindable(false) } = $props<{
		open?: boolean;
	}>();

	const googleEnabled = publicEnv.PUBLIC_GOOGLE_ENABLED === 'true';

	let mode = $state<'signin' | 'signup' | 'forgot'>('signin');
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	let error = $state('');

	function reset() {
		mode = 'signin';
		name = '';
		email = '';
		password = '';
		confirm = '';
		loading = false;
		error = '';
	}

	function switchMode(next: 'signin' | 'signup' | 'forgot') {
		if (loading) return;
		mode = next;
		error = '';
	}

	async function onForgotSubmit() {
		if (loading) return;
		error = '';
		if (!email.trim()) {
			error = 'Enter the email on your account.';
			return;
		}
		loading = true;
		try {
			const res = await client.requestPasswordReset({
				email: email.trim(),
				redirectTo: '/reset-password'
			});
			if (res.error) {
				error = friendlyMessage(res.error.message);
				return;
			}
			error = '';
			mode = 'signin';
			email = '';
			toast.success('If that email exists, a reset link is on its way.');
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}

	function friendlyMessage(message?: string): string {
		if (!message) return 'Something went wrong. Please try again.';
		const m = message.toLowerCase();
		if (m.includes('invalid email or password')) return 'Incorrect email or password.';
		if (m.includes('already exists') || m.includes('already been registered')) {
			return 'An account with that email already exists. Sign in instead.';
		}
		if (m.includes('too short') || m.includes('password')) return 'Password must be at least 8 characters.';
		if (m.includes('valid email')) return 'Please enter a valid email address.';
		if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a moment and try again.';
		return message;
	}

	async function onGoogle() {
		await signIn.social({
			provider: 'google',
			callbackURL: `${page.url.pathname}?signIn=1`
		});
	}

	async function onSubmit() {
		if (loading) return;
		error = '';
		loading = true;

		try {
			if (mode === 'signin') {
				if (!email.trim() || !password) {
					error = 'Enter your email and password.';
					return;
				}
				const res = await signIn.email({
					email: email.trim(),
					password
				});
				if (res.error) {
					error = friendlyMessage(res.error.message);
					return;
				}
			} else {
				if (name.trim().length < 2) {
					error = 'Enter a display name.';
					return;
				}
				if (!email.trim()) {
					error = 'Enter your email.';
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
				const res = await signUp.email({
					name: name.trim(),
					email: email.trim(),
					password
				});
				if (res.error) {
					error = friendlyMessage(res.error.message);
					return;
				}
			}

			toast.success(mode === 'signin' ? 'Welcome back!' : 'Welcome to Vellum!');
			open = false;
			reset();
			await invalidateAll();
		} catch {
			error = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open onOpenChange={(o) => { if (!o) reset(); }}>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Welcome to Vellum</DialogTitle>
			<DialogDescription>
				{mode === 'signin'
					? 'Sign in to your account and get back to trading.'
					: mode === 'signup'
						? 'Create a free account and start building your portfolio.'
						: 'Enter your email and we will send you a link to reset your password.'}
			</DialogDescription>
		</DialogHeader>

		<div class="flex flex-col gap-5 py-2">
			{#if mode !== 'forgot'}
				<div class="bg-muted/50 grid grid-cols-2 gap-1 rounded-lg p-1">
					<button
						type="button"
						onclick={() => switchMode('signin')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode === 'signin'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Sign in
					</button>
					<button
						type="button"
						onclick={() => switchMode('signup')}
						class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {mode === 'signup'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'}"
					>
						Create account
					</button>
				</div>
			{/if}

			<form class="flex flex-col gap-3" onsubmit={(e) => { e.preventDefault(); mode === 'forgot' ? onForgotSubmit() : onSubmit(); }}>
				{#if mode === 'signup'}
					<div class="space-y-1.5">
						<Label for="auth-name">Display name</Label>
						<Input
							id="auth-name"
							bind:value={name}
							placeholder="How people will see you"
							autocomplete="nickname"
							maxlength={30}
						/>
					</div>
				{/if}

				<div class="space-y-1.5">
					<Label for="auth-email">Email</Label>
					<Input
						id="auth-email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>

				{#if mode !== 'forgot'}
					<div class="space-y-1.5">
						<Label for="auth-password">Password</Label>
						<Input
							id="auth-password"
							type="password"
							bind:value={password}
							placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
							autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
						/>
					</div>
				{/if}

				{#if mode === 'signin'}
					<button
						type="button"
						onclick={() => switchMode('forgot')}
						class="text-primary -mt-1 self-start text-xs font-medium hover:underline"
					>
						Forgot password?
					</button>
				{/if}

				{#if mode === 'signup'}
					<div class="space-y-1.5">
						<Label for="auth-confirm">Confirm password</Label>
						<Input
							id="auth-confirm"
							type="password"
							bind:value={confirm}
							placeholder="Re-enter your password"
							autocomplete="new-password"
						/>
					</div>
				{/if}

				{#if error}
					<p class="text-destructive text-sm font-medium" role="alert">{error}</p>
				{/if}

				<Button type="submit" class="w-full" disabled={loading}>
					{loading
						? 'Please wait…'
						: mode === 'signin'
							? 'Sign in'
							: mode === 'signup'
								? 'Create account'
								: 'Send reset link'}
				</Button>

				{#if mode === 'forgot'}
					<button
						type="button"
						onclick={() => switchMode('signin')}
						class="text-muted-foreground hover:text-foreground self-center text-xs font-medium transition-colors"
					>
						Back to sign in
					</button>
				{/if}
			</form>

			{#if mode !== 'forgot' && googleEnabled}
				<div class="flex items-center gap-3">
					<span class="bg-border h-px flex-1"></span>
					<span class="text-muted-foreground text-xs">or continue with</span>
					<span class="bg-border h-px flex-1"></span>
				</div>

				<Button
					class="flex w-full items-center justify-center gap-2"
					variant="outline"
					onclick={onGoogle}
				>
					<img
						class="h-5 w-5"
						src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
						alt="Google"
					/>
					<span>Continue with Google</span>
				</Button>
			{/if}

			<p class="text-muted-foreground text-center text-xs">
				By continuing, you agree to our
				<a href="/legal/terms" class="text-primary hover:underline">Terms of Service</a>
				and
				<a href="/legal/privacy" class="text-primary hover:underline">Privacy Policy</a>
			</p>
		</div>
	</DialogContent>
</Dialog>
