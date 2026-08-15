<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { getPublicUrl, debounce } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { onMount, onDestroy } from 'svelte';
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import {
		Tick01Icon,
		VolumeHighIcon,
		VolumeMute01Icon,
		Download01Icon,
		Delete01Icon,
		Notification03Icon,
		ArrowLeft01Icon,
		ArrowRight01Icon
	} from '@hugeicons/core-free-icons';
	import * as Pagination from '$lib/components/ui/pagination';
	import { toast } from 'svelte-sonner';
	import { MAX_FILE_SIZE, MAX_SONG_SIZE } from '$lib/data/constants';
	import { BANNER_PRESETS, getBannerPreset } from '$lib/data/profile-customization';
	import { volumeSettings } from '$lib/stores/volume-settings';
	import { USER_DATA } from '$lib/stores/user-data';
	import * as Dialog from '$lib/components/ui/dialog';
	import SEO from '$lib/components/self/SEO.svelte';
	import { haptic } from '$lib/stores/haptics';

	let shouldSignIn = $state(false);
	let name = $state($USER_DATA?.name || '');
	let bio = $state($USER_DATA?.bio ?? '');
	let username = $state($USER_DATA?.username || '');

	const initialUsername = $USER_DATA?.username || '';
	let avatarFile: FileList | undefined = $state(undefined);

	let previewUrl: string | null = $state(null);
	let currentAvatarUrl = $derived(previewUrl || getPublicUrl($USER_DATA?.image ?? null));

	let nameError = $state('');

	let isDirty = $derived(
		name !== ($USER_DATA?.name || '') ||
			bio !== ($USER_DATA?.bio ?? '') ||
			username !== ($USER_DATA?.username || '') ||
			avatarFile !== undefined
	);

	let fileInput: HTMLInputElement | undefined = $state(undefined);

	let loading = $state(false);
	let usernameAvailable: boolean | null = $state(null);
	let checkingUsername = $state(false);
	let masterVolume = $state(($USER_DATA?.volumeMaster || 0) * 100);
	let isMuted = $state($USER_DATA?.volumeMuted || false);

	let deleteDialogOpen = $state(false);
	let deleteConfirmationText = $state('');
	let isDeleting = $state(false);
	let isDownloading = $state(false);
	let disableMentions = $state($USER_DATA?.disableMentions || false);

	// Profile appearance
	let bannerColor = $state<string | null>($USER_DATA?.bannerColor ?? null);
	let bannerPreviewUrl = $state<string | null>(null);
	let bannerInput: HTMLInputElement | undefined = $state(undefined);
	let songName = $state<string>($USER_DATA?.profileSongName ?? '');
	let songInput: HTMLInputElement | undefined = $state(undefined);
	let songPreviewUrl = $state<string | null>(null);
	let previewAudio: HTMLAudioElement | undefined = undefined;
	let previewing = $state(false);

	let hasSong = $derived(!!$USER_DATA?.profileSong);
	let displaySongName = $derived($USER_DATA?.profileSongName ?? 'Profile track');

	let bannerPreviewCss = $derived(
		bannerPreviewUrl
			? null
			: getBannerPreset(bannerColor)?.css ?? 'linear-gradient(120deg, #7c3aed, #4f46e5)'
	);

	// Blocked users state
	let blockedUsers = $state<Array<{ id: number; blockedId: number; username: string; name: string; image: string | null; createdAt: string }>>([]);
	let blockedLoading = $state(false);
	let unblockingUser = $state<string | null>(null);
	let blockedPage = $state(1);
	const blockedPerPage = 10;
	let blockedTotalPages = $derived(Math.ceil(blockedUsers.length / blockedPerPage));
	let paginatedBlocked = $derived(blockedUsers.slice((blockedPage - 1) * blockedPerPage, blockedPage * blockedPerPage));

	async function loadBlockedUsers() {
		blockedLoading = true;
		try {
			const res = await fetch('/api/settings/blocked');
			if (res.ok) {
				const data = await res.json();
				blockedUsers = data.blocks ?? [];
			} else {
				toast.error('Failed to load blocked users');
			}
		} catch {
			toast.error('Failed to load blocked users');
		}
		blockedLoading = false;
	}

	async function unblockUser(username: string) {
		unblockingUser = username;
		try {
			const res = await fetch(`/api/user/${username}/block`, { method: 'DELETE' });
			if (res.ok) {
				blockedUsers = blockedUsers.filter(b => b.username !== username);
				toast.success(`Unblocked @${username}`);
			} else {
				toast.error('Failed to unblock user');
			}
		} catch {
			toast.error('Failed to unblock user');
		}
		unblockingUser = null;
	}

	function beforeUnloadHandler(e: BeforeUnloadEvent) {
		if (isDirty) {
			e.preventDefault();
		}
	}

	onMount(() => {
		window.addEventListener('beforeunload', beforeUnloadHandler);
		volumeSettings.setMaster($USER_DATA?.volumeMaster || 0);
		volumeSettings.setMuted($USER_DATA?.volumeMuted || false);
		loadBlockedUsers();
	});

	onDestroy(() => {
		window.removeEventListener('beforeunload', beforeUnloadHandler);
	});

	function handleAvatarClick() {
		fileInput?.click();
	}
	function handleAvatarChange(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (f) {
			// Check file size
			if (f.size > MAX_FILE_SIZE) {
				toast.error('Profile picture must be smaller than 1MB');
				(e.target as HTMLInputElement).value = '';
				return;
			}

			// Check file type
			if (!f.type.startsWith('image/')) {
				toast.error('Please select a valid image file');
				(e.target as HTMLInputElement).value = '';
				return;
			}

			previewUrl = URL.createObjectURL(f);
			const files = (e.target as HTMLInputElement).files;
			if (files) avatarFile = files;
		}
	}

	const checkUsername = debounce(async (val: string) => {
		if (val.length < 3) return (usernameAvailable = null);
		checkingUsername = true;
		const res = await fetch(`/api/settings/check-username?username=${val}`);
		usernameAvailable = (await res.json()).available;
		checkingUsername = false;
	}, 500);

	$effect(() => {
		if (username !== initialUsername) checkUsername(username);
	});

	$effect(() => {
		validateName();
	});

	function validateName() {
		if (!name.trim()) {
			nameError = 'Display name is required.';
		} else if (name.trim().length < 2) {
			nameError = 'Display name must be at least 2 characters.';
		} else if (name.trim().length > 50) {
			nameError = 'Display name must be 50 characters or less.';
		} else {
			nameError = '';
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;

		try {
			const fd = new FormData();
			fd.append('name', name.trim());
			fd.append('bio', bio);
			fd.append('username', username);
			if (avatarFile?.[0]) fd.append('avatar', avatarFile[0]);

			const res = await fetch('/api/settings', { method: 'POST', body: fd });

			if (res.ok) {
				await invalidateAll();
				haptic.trigger('success');
				toast.success('Settings updated successfully!', {
					action: { label: 'Refresh', onClick: () => window.location.reload() }
				});
			} else {
				const result = await res.json();
				toast.error('Failed to update settings', {
					description: result.message || 'An error occurred while updating your settings'
				});
			}
		} catch (error) {
			toast.error('Failed to update settings', {
				description: 'An unexpected error occurred'
			});
		} finally {
			loading = false;
		}
	}

	const debouncedSaveVolume = debounce(async (settings: { master: number; muted: boolean }) => {
		try {
			const response = await fetch('/api/settings/volume', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(settings)
			});

			if (!response.ok) {
				throw new Error('Failed to save volume settings');
			}
		} catch (error) {
			console.error('Failed to save volume settings:', error);
			toast.error('Failed to save volume settings');
		}
	}, 500);

	async function saveVolumeToServer(settings: { master: number; muted: boolean }) {
		debouncedSaveVolume(settings);
	}

	async function saveAppearance(fields: {
		bannerColor?: string | null;
		banner?: File;
		song?: File;
		songName?: string | null;
		songRemove?: boolean;
	}) {
		const fd = new FormData();
		if (fields.bannerColor !== undefined) fd.append('bannerColor', fields.bannerColor ?? '');
		if (fields.banner) fd.append('banner', fields.banner);
		if (fields.song) fd.append('song', fields.song);
		if (fields.songName !== undefined) fd.append('songName', fields.songName ?? '');
		if (fields.songRemove) fd.append('songRemove', '1');
		try {
			const res = await fetch('/api/settings/appearance', { method: 'POST', body: fd });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				toast.error(data.message || 'Failed to save appearance');
				return false;
			}
			await invalidateAll();
			haptic.trigger('success');
			return true;
		} catch {
			toast.error('Failed to save appearance');
			return false;
		}
	}

	function pickBannerPreset(key: string) {
		bannerColor = key;
		bannerPreviewUrl = null;
		saveAppearance({ bannerColor: key });
	}

	function removeBanner() {
		bannerColor = null;
		bannerPreviewUrl = null;
		saveAppearance({ bannerColor: '' });
	}

	function handleBannerFile(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (f.size > MAX_FILE_SIZE) {
			toast.error('Banner must be smaller than 1MB');
			(e.target as HTMLInputElement).value = '';
			return;
		}
		if (!f.type.startsWith('image/')) {
			toast.error('Please select a valid image file');
			(e.target as HTMLInputElement).value = '';
			return;
		}
		bannerPreviewUrl = URL.createObjectURL(f);
		bannerColor = null;
		saveAppearance({ banner: f });
	}

	function togglePreview() {
		const src = songPreviewUrl || getPublicUrl($USER_DATA?.profileSong ?? null);
		if (!src) return;
		if (previewing) {
			previewAudio?.pause();
			previewing = false;
			return;
		}
		if (!previewAudio) previewAudio = new Audio();
		previewAudio.src = src;
		previewAudio.loop = true;
		previewAudio.volume = 0.5;
		previewAudio.play().catch(() => {});
		previewing = true;
	}

	function handleSongFile(e: Event) {
		const f = (e.target as HTMLInputElement).files?.[0];
		if (!f) return;
		if (f.size > MAX_SONG_SIZE) {
			toast.error('Song must be smaller than 20MB');
			(e.target as HTMLInputElement).value = '';
			return;
		}
		if (!f.type.startsWith('audio/')) {
			toast.error('Please select a valid audio file (MP3, WAV, OGG, M4A, AAC, FLAC, or WebM)');
			(e.target as HTMLInputElement).value = '';
			return;
		}
		const fallbackName = f.name.replace(/\.[^.]+$/, '').slice(0, 80);
		const nameToUse = songName.trim() || fallbackName;
		songPreviewUrl = URL.createObjectURL(f);
		previewAudio?.pause();
		previewing = false;
		saveAppearance({ song: f, songName: nameToUse });
	}

	async function saveSongName() {
		const name = songName.trim().slice(0, 80);
		if (!name) {
			toast.error('Enter a song title');
			return;
		}
		await saveAppearance({ songName: name });
	}

	function clearSong() {
		previewAudio?.pause();
		previewing = false;
		songPreviewUrl = null;
		songName = '';
		saveAppearance({ songRemove: true });
	}

	async function toggleDisableMentions() {
		disableMentions = !disableMentions;
		haptic.trigger('light');
		try {
			const response = await fetch('/api/settings/mentions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ disableMentions })
			});
			if (!response.ok) {
				disableMentions = !disableMentions;
				toast.error('Failed to update mention settings');
			}
		} catch {
			disableMentions = !disableMentions;
			toast.error('Failed to update mention settings');
		}
	}

	function handleMasterVolumeChange(value: number) {
		masterVolume = value;
		const normalizedValue = value / 100;
		volumeSettings.setMaster(normalizedValue);
		saveVolumeToServer({ master: normalizedValue, muted: isMuted });
	}
	function toggleMute() {
		isMuted = !isMuted;
		haptic.trigger('light');
		volumeSettings.setMuted(isMuted);
		saveVolumeToServer({ master: masterVolume / 100, muted: isMuted });
	}

	async function downloadUserData() {
		isDownloading = true;
		try {
			const headResponse = await fetch('/api/settings/data-download', {
				method: 'HEAD'
			});

			if (!headResponse.ok) {
				throw new Error('Download service unavailable');
			}

			const contentLength = headResponse.headers.get('Content-Length');
			if (contentLength) {
				const sizeInMB = parseInt(contentLength) / (1024 * 1024);
				if (sizeInMB > 50) {
					const proceed = confirm(
						`Your data export is ${sizeInMB.toFixed(1)}MB. This may take a while to download. Continue?`
					);
					if (!proceed) {
						isDownloading = false;
						return;
					}
				}
			}

			const downloadUrl = '/api/settings/data-download';

			const downloadWindow = window.open(downloadUrl, '_blank');

			if (!downloadWindow || downloadWindow.closed) {
				const a = document.createElement('a');
				a.href = downloadUrl;
				a.style.display = 'none';
				a.target = '_blank';
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			} else {
				setTimeout(() => {
					try {
						downloadWindow.close();
					} catch (e) {}
				}, 1000);
			}

			toast.success('Your data download has started');
		} catch (error) {
			console.error('Download error:', error);
			toast.error('Failed to start data download: ' + (error as Error).message);
		} finally {
			isDownloading = false;
		}
	}

	async function deleteAccount() {
		if (deleteConfirmationText !== 'DELETE MY ACCOUNT') {
			haptic.trigger('error');
			toast.error('Please type "DELETE MY ACCOUNT" to confirm');
			return;
		}

		isDeleting = true;
		try {
			const response = await fetch('/api/settings/delete-account', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					confirmationText: deleteConfirmationText
				})
			});

			const result = await response.json();

			if (!response.ok) {
				if (response.status === 409) {
					toast.error('Account deletion already scheduled', {
						description: 'You have already requested account deletion. Contact support to cancel.'
					});
				} else {
					throw new Error(result.message || 'Failed to delete account');
				}
			} else {
				toast.success('Account deletion scheduled successfully', {
					description: result.message
				});
			}
		} catch (error: any) {
			console.error('Delete account error:', error);
			toast.error('Failed to delete account: ' + error.message);
		} finally {
			isDeleting = false;
			deleteDialogOpen = false;
			deleteConfirmationText = '';
		}
	}
</script>

<SEO
	title="Settings - Vellum"
	description="Manage your Vellum account settings, profile information, audio preferences, and privacy options."
	keywords="game account settings, profile settings game, privacy settings, audio settings game"
/>

<div class="container mx-auto max-w-2xl p-6">
	<h1 class="mb-6 text-2xl font-bold">Settings</h1>

	{#if !$USER_DATA}
	<div class="flex h-96 items-center justify-center">
		<div class="text-center">
			<div class="text-muted-foreground mb-4 text-xl">
				You need to be logged in to view your settings
			</div>
			<Button onclick={() => (shouldSignIn = true)}>Sign In</Button>
		</div>
	</div>
{:else}
	<div class="space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Profile Settings</Card.Title>
				<Card.Description>Update your profile information</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="mb-6 flex items-center gap-4">
					<div
						class="group relative cursor-pointer"
						role="button"
						tabindex="0"
						onclick={handleAvatarClick}
						onkeydown={(e) => e.key === 'Enter' && handleAvatarClick()}
					>
						<Avatar.Root class="size-20">
							<Avatar.Image src={currentAvatarUrl} alt={name} />
							<Avatar.Fallback>?</Avatar.Fallback>
						</Avatar.Root>
						<div
							class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<span class="text-xs text-white">Change</span>
						</div>
					</div>
					<div>
						<h3 class="text-lg font-semibold">{name}</h3>
						<p class="text-muted-foreground text-sm">@{username}</p>
					</div>
				</div>

				<input
					type="file"
					accept="image/*"
					class="hidden"
					bind:this={fileInput}
					onchange={handleAvatarChange}
				/>

				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="space-y-2">
						<Label for="name">Display Name</Label>
						<Input
							id="name"
							bind:value={name}
							required
							class={nameError ? 'border-destructive' : ''}
						/>
						{#if nameError}
							<p class="text-destructive text-sm">{nameError}</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="username">Username</Label>
						<div class="relative">
							<span class="text-muted-foreground absolute left-3 top-4 -translate-y-1/2 transform"
								>@</span
							>
							<Input
								id="username"
								bind:value={username}
								required
								pattern={'^[a-zA-Z0-9_]{3,30}$'}
								class="pl-8"
							/>
							<div class="absolute right-3 top-1.5">
								{#if checkingUsername}
									<span class="text-muted-foreground text-sm">Checking…</span>
								{:else if username !== initialUsername}
									{#if usernameAvailable}
										<HugeiconsIcon icon={Tick01Icon} class="text-success" />
									{:else}
										<span class="text-destructive text-sm">Taken</span>
									{/if}
								{/if}
							</div>
						</div>
						<p class="text-muted-foreground text-xs">
							Only letters, numbers, underscores. 3–30 characters.
						</p>
					</div>

					<div class="space-y-2">
						<Label for="bio">Bio</Label>
						<Textarea id="bio" bind:value={bio} rows={4} placeholder="Tell us about yourself" />
					</div>

					<Button type="submit" disabled={loading || !isDirty || !!nameError}>
						{loading ? 'Saving…' : 'Save Changes'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Profile Appearance</Card.Title>
				<Card.Description>Set your profile banner and soundtrack</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div class="space-y-3">
					<Label>Banner</Label>
					<div
						class="relative h-28 overflow-hidden rounded-xl"
						style="background: {bannerPreviewCss};"
					>
						{#if bannerPreviewUrl}
							<img
								src={bannerPreviewUrl}
								alt="Banner preview"
								class="h-full w-full object-cover"
							/>
						{:else if $USER_DATA?.bannerImage && !bannerPreviewUrl && !bannerColor}
							<img
								src={getPublicUrl($USER_DATA.bannerImage)}
								alt="Banner"
								class="h-full w-full object-cover"
							/>
						{/if}
						<button
							type="button"
							class="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-opacity hover:bg-black/40 hover:opacity-100"
							onclick={() => bannerInput?.click()}
						>
							<span class="rounded-md bg-black/60 px-3 py-1 text-xs font-medium">Upload image</span>
						</button>
					</div>
					<input
						type="file"
						accept="image/*"
						class="hidden"
						bind:this={bannerInput}
						onchange={handleBannerFile}
					/>
					<div class="flex flex-wrap items-center gap-2">
						{#each BANNER_PRESETS as preset (preset.key)}
							<button
								type="button"
								title={preset.label}
								aria-label={`Banner: ${preset.label}`}
								onclick={() => pickBannerPreset(preset.key)}
								class="h-8 w-8 rounded-lg ring-offset-2 transition-transform hover:scale-110 {bannerColor ===
								preset.key
									? 'ring-2 ring-primary'
									: ''}"
								style="background: {preset.css};"
							></button>
						{/each}
						<Button variant="outline" size="sm" onclick={() => bannerInput?.click()}>
							Upload
						</Button>
						<Button variant="ghost" size="sm" onclick={removeBanner}>
							Remove
						</Button>
					</div>
				</div>

				<div class="space-y-3">
					<Label>Profile Music</Label>
					<p class="text-muted-foreground text-xs">
						Upload any song (MP3, WAV, OGG, M4A, AAC, FLAC, or WebM, up to 20MB). Visitors
						can play it on your profile.
					</p>

					{#if hasSong}
						<div class="flex items-center justify-between gap-3 rounded-lg border p-3">
							<div class="min-w-0">
								<div class="truncate font-medium">{displaySongName}</div>
								<div class="text-muted-foreground text-xs">Live on your profile</div>
							</div>
							<div class="flex shrink-0 gap-2">
								<Button variant="ghost" size="sm" onclick={togglePreview}>
									{previewing ? 'Stop' : 'Preview'}
								</Button>
								<Button variant="outline" size="sm" onclick={clearSong}>Remove</Button>
							</div>
						</div>
					{:else}
						<div class="text-muted-foreground text-xs">No song on your profile yet.</div>
					{/if}

					<div class="flex flex-wrap items-end gap-2">
						<div class="min-w-0 flex-1 space-y-1">
							<Label for="song-name" class="text-xs">Song title</Label>
							<Input
								id="song-name"
								bind:value={songName}
								placeholder="My track"
								maxlength={80}
								class="h-9"
							/>
						</div>
						<Button variant="outline" size="sm" onclick={() => songInput?.click()}>
							{hasSong ? 'Replace' : 'Upload song'}
						</Button>
					</div>
					{#if hasSong && songName.trim() && songName.trim() !== displaySongName}
						<Button variant="ghost" size="sm" onclick={saveSongName}>Save title</Button>
					{/if}
					<input
						type="file"
						accept="audio/*"
						class="hidden"
						bind:this={songInput}
						onchange={handleSongFile}
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Audio Settings</Card.Title>
				<Card.Description>Adjust volume for game sounds</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<Label class="text-base font-medium">Volume</Label>
						<div class="flex items-center gap-2">
							<Button variant="ghost" size="sm" onclick={toggleMute} class="h-8 w-8 p-0">
								{#if isMuted}
									<HugeiconsIcon icon={VolumeMute01Icon} class="h-4 w-4" />
								{:else}
									<HugeiconsIcon icon={VolumeHighIcon} class="h-4 w-4" />
								{/if}
							</Button>
							<span class="text-muted-foreground w-10 text-right text-sm"
								>{Math.round(masterVolume)}%</span
							>
						</div>
					</div>
					{#if browser}
						<Slider
							type="single"
							value={masterVolume}
							onValueChange={handleMasterVolumeChange}
							max={100}
							step={1}
							disabled={isMuted}
						/>
					{:else}
						<!-- Fallback slider for SSR -->
						<div class="relative flex w-full touch-none select-none items-center">
							<div class="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
								<div
									class="absolute h-full bg-primary transition-all"
									style="width: {masterVolume}%"
								></div>
							</div>
						</div>
					{/if}
					<p class="text-muted-foreground text-xs">
						Controls all game sounds including effects and background audio
					</p>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Notification Settings</Card.Title>
				<Card.Description>Control how you receive notifications</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="space-y-1">
						<h4 class="text-sm font-medium">Mentions</h4>
						<p class="text-muted-foreground text-xs">
							Receive notifications when someone @mentions you in comments
						</p>
					</div>
					<Switch checked={!disableMentions} onCheckedChange={toggleDisableMentions} />
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Blocked Users</Card.Title>
				<Card.Description>Users you've blocked won't appear in comments and can't send you notifications</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#if blockedLoading}
					<p class="text-muted-foreground text-sm">Loading...</p>
				{:else if blockedUsers.length === 0}
					<p class="text-muted-foreground text-sm">You haven't blocked anyone.</p>
				{:else}
					{#each paginatedBlocked as blocked}
						<div class="flex items-center justify-between rounded-lg border p-3">
							<div class="flex items-center gap-3">
								<a href="/user/{blocked.username}" class="font-medium hover:underline">@{blocked.username}</a>
							</div>
							<Button
								variant="outline"
								size="sm"
								onclick={() => unblockUser(blocked.username)}
								disabled={unblockingUser === blocked.username}
							>
								{unblockingUser === blocked.username ? 'Unblocking...' : 'Unblock'}
							</Button>
						</div>
					{/each}
					{#if blockedTotalPages > 1}
						<div class="mt-4 flex justify-center">
							<Pagination.Root
								count={blockedUsers.length}
								perPage={blockedPerPage}
								siblingCount={1}
								page={blockedPage}
								onPageChange={(page) => { blockedPage = page; }}
							>
								{#snippet children({ pages, currentPage: paginationCurrentPage })}
									<Pagination.Content>
										<Pagination.Item>
											<Pagination.PrevButton>
												<HugeiconsIcon icon={ArrowLeft01Icon} class="h-4 w-4" />
											</Pagination.PrevButton>
										</Pagination.Item>
										{#each pages as page (page.key)}
											{#if page.type === 'ellipsis'}
												<Pagination.Item>
													<Pagination.Ellipsis />
												</Pagination.Item>
											{:else}
												<Pagination.Item>
													<Pagination.Link {page} isActive={paginationCurrentPage === page.value}>
														{page.value}
													</Pagination.Link>
												</Pagination.Item>
											{/if}
										{/each}
										<Pagination.Item>
											<Pagination.NextButton>
												<HugeiconsIcon icon={ArrowRight01Icon} class="h-4 w-4" />
											</Pagination.NextButton>
										</Pagination.Item>
									</Pagination.Content>
								{/snippet}
							</Pagination.Root>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Data & Privacy</Card.Title>
				<Card.Description>Manage your personal data and account</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-4">
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div class="space-y-1">
							<h4 class="text-sm font-medium">Download Your Data</h4>
							<p class="text-muted-foreground text-xs">
								Export a complete copy of your account data including transactions, bets, and
								profile information.
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onclick={downloadUserData}
							disabled={isDownloading}
							class="ml-4"
						>
							<HugeiconsIcon icon={Download01Icon} class="h-4 w-4" />
							{isDownloading ? 'Downloading...' : 'Download Data'}
						</Button>
					</div>

					<div
						class="border-destructive/20 bg-destructive/5 flex items-center justify-between rounded-lg border p-4"
					>
						<div class="space-y-1">
							<h4 class="text-destructive text-sm font-medium">Delete Account</h4>
							<p class="text-muted-foreground text-xs">
								Schedule your account for permanent deletion. This will anonymize your data while
								preserving transaction records for compliance.
							</p>
						</div>
						<Button
							variant="destructive"
							size="sm"
							onclick={() => (deleteDialogOpen = true)}
							class="ml-4"
						>
							<HugeiconsIcon icon={Delete01Icon} class="h-4 w-4" />
							Delete Account
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
	{/if}
</div>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="text-destructive">Delete Account</Dialog.Title>
			<Dialog.Description>
				This action cannot be undone. Your account will be scheduled for permanent deletion, after a
				grace period of <span class="font-semibold">14 days</span>. Your data will be anonymized.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4">
			<div class="bg-destructive/10 rounded-lg p-4">
				<h4 class="mb-2 text-sm font-medium">What happens when you delete your account:</h4>
				<ul class="text-muted-foreground space-y-1 text-xs">
					<li>• Your profile information will be permanently removed</li>
					<li>• You will be logged out from all devices</li>
					<li>• Your comments will be anonymized</li>
					<li>• Transaction history will be preserved for compliance (anonymized)</li>
					<li>• You will not be able to recover this account</li>
				</ul>
			</div>
			<div class="space-y-2">
				<Label for="delete-confirmation">Type "DELETE MY ACCOUNT" to confirm:</Label>
				<Input
					id="delete-confirmation"
					bind:value={deleteConfirmationText}
					placeholder="DELETE MY ACCOUNT"
					class="font-mono"
				/>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (deleteDialogOpen = false)}>Cancel</Button>
			<Button
				variant="destructive"
				onclick={deleteAccount}
				disabled={isDeleting || deleteConfirmationText !== 'DELETE MY ACCOUNT'}
			>
				{isDeleting ? 'Deleting...' : 'Delete Account'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>