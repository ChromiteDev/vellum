<script lang="ts">
	import { page } from '$app/stores';

	let {
		title = 'Vellum',
		description = 'Vellum is a realistic cryptocurrency market with AI-powered pricing, live liquidity pools, and a full arcade. Trade, launch coins, and climb the leaderboard.',
		type = 'website',
		image = '/apple-touch-icon.png',
		imageAlt = 'Vellum Logo',
		keywords = '',
		author = 'Vellum',
		canonicalUrl = '',
		noindex = false,
		twitterCard = 'summary_large_image'
	}: {
		title?: string;
		description?: string;
		type?: 'website' | 'article' | 'profile';
		image?: string | null;
		imageAlt?: string;
		keywords?: string;
		author?: string;
		canonicalUrl?: string;
		noindex?: boolean;
		twitterCard?: 'summary' | 'summary_large_image';
	} = $props();

	let currentUrl = $derived($page?.url?.href || '');
	let canonical = $derived(canonicalUrl || currentUrl);

	let fullImageUrl = $derived(
		image?.startsWith('http') ? image : `${$page?.url?.origin || 'https://vellum.com'}${image}`
	);

	let defaultKeywords =
		'cryptocurrency market, trading platform, paper trading, crypto market game, defi, blockchain, bitcoin, ethereum, trading, crypto learning';
	let allKeywords = $derived(keywords ? `${defaultKeywords}, ${keywords}` : defaultKeywords);
</script>

<svelte:head>
	<!-- Basic Meta Tags -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta name="keywords" content={allKeywords} />
	<meta name="author" content={author} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	<!-- Canonical URL -->
	{#if canonical}
		<link rel="canonical" href={canonical} />
	{/if}

	<!-- Open Graph Meta Tags -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={currentUrl} />
	<meta property="og:image" content={fullImageUrl} />
	<meta property="og:image:alt" content={imageAlt} />
	<meta property="og:site_name" content="Vellum" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content={twitterCard} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={fullImageUrl} />
	<meta name="twitter:image:alt" content={imageAlt} />

	<!-- Additional Meta Tags -->
	<meta name="theme-color" content="#7c3aed" />
	<meta name="application-name" content="Vellum" />
	<meta name="apple-mobile-web-app-title" content="Vellum" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
</svelte:head>
