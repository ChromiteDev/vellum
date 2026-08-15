<script lang="ts">
	export type VellumIconName =
		| 'home'
		| 'market'
		| 'hopium'
		| 'arcade'
		| 'leaderboard'
		| 'shop'
		| 'achievements'
		| 'portfolio'
		| 'treemap'
		| 'create'
		| 'bell'
		| 'about'
		| 'search'
		| 'settings'
		| 'stats'
		| 'community'
		| 'profile'
		| 'inventory'
		| 'events'
		| 'challenge'
		| 'founder'
		| 'admin'
		| 'season'
		| 'gift'
		| 'book'
		| 'key'
		| 'logout'
		| 'moon'
		| 'sun';

	const ICONS: Record<VellumIconName, string> = {
		home: '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.5 9.5V19.5h13V9.5"/><path d="M10 19.5V14h4v5.5"/>',
		market:
			'<path d="M6.5 5v3"/><path d="M5 8h3v8H5z"/><path d="M6.5 16v3.5"/><path d="M12 3.5v1.5"/><path d="M10.5 5h3v11h-3z"/><path d="M12 16v4.5"/><path d="M17.5 6.5v2.5"/><path d="M16 9h3v6h-3z"/><path d="M17.5 15v2.5"/>',
		hopium:
			'<circle cx="12" cy="10.5" r="6.5"/><path d="M8.5 19.5h7"/><path d="M10.5 19.5v1.8"/><path d="M13.5 19.5v1.8"/><path d="M17.8 4.6l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z"/>',
		arcade:
			'<path d="M6.5 9h11a3.5 3.5 0 0 1 3.5 3.5v2a3.5 3.5 0 0 1-3.5 3.5h-1.2l-1.8-2.6H9.5L7.7 18H6.5A3.5 3.5 0 0 1 3 14.5v-2A3.5 3.5 0 0 1 6.5 9z"/><path d="M9 12.4v2.7"/><path d="M7.65 13.75h2.7"/><circle cx="15.2" cy="12.7" r="1.1"/><circle cx="16.8" cy="14.4" r="1.1"/>',
		leaderboard:
			'<path d="M12 20V8.5"/><path d="M6 20v-5.5"/><path d="M18 20v-8"/><path d="M3.5 20h17"/><path d="M12 5l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L9.1 7.2l2-.3z"/>',
		shop:
			'<path d="M5.5 8.5h13l1 12.5H4.5l1-12.5z"/><path d="M9 8.5v-2.2a3 3 0 0 1 6 0v2.2"/>',
		achievements:
			'<circle cx="12" cy="14" r="5.2"/><path d="M8.7 13.6 6 20l2.9-1.3L12 17.4l3.1 1.3L18 20l-2.7-6.4"/>',
		portfolio:
			'<path d="M4 8.5h16v10.5H4z"/><path d="M9 8.5v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M8 13.2h8"/>',
		treemap:
			'<path d="M4 4h16v16H4z"/><path d="M11 4v16"/><path d="M11 12.5h9"/><path d="M4 10.5h7"/>',
		create:
			'<circle cx="12" cy="12" r="7.2"/><path d="M12 8.3v7.4"/><path d="M8.3 12h7.4"/>',
		bell:
			'<path d="M5.5 9.5a6.5 6.5 0 0 1 13 0c0 5 1.6 6.5 1.6 6.5H3.9s1.6-1.5 1.6-6.5z"/><path d="M10 19.6a2.2 2.2 0 0 0 4 0"/>',
		about:
			'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.2"/><circle cx="12" cy="7.9" r="0.9" fill="currentColor" stroke="none"/>',
		search: '<circle cx="11" cy="11" r="6.5"/><path d="M15.8 15.8 20 20"/>',
		settings:
			'<path d="M4 7.5h9"/><path d="M17 7.5h3"/><circle cx="15" cy="7.5" r="2"/><path d="M4 16.5h4"/><path d="M12 16.5h8"/><circle cx="10" cy="16.5" r="2"/>',
		stats:
			'<path d="M4 20h16"/><path d="M6.5 20v-5.5"/><path d="M11 20V8.5"/><path d="M15.5 20v-8"/><path d="M19.5 20V4.5"/><path d="M19.5 4.5l-2.8 2.8M19.5 4.5l2.8 2.8" />',
		community:
			'<circle cx="9" cy="8.5" r="3.2"/><path d="M4 19.5c.7-3.2 2.6-5 5-5s4.3 1.8 5 5"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M14.5 19.5c.4-2.4 1.9-4.2 4-4.2s3.6 1.8 4 4.2"/>',
		profile:
			'<circle cx="12" cy="8.2" r="4"/><path d="M4.5 20c.8-4.2 3.6-6.2 7.5-6.2s6.7 2 7.5 6.2"/>',
		inventory:
			'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4"/><path d="M12 12v8"/>',
		events:
			'<path d="M4.5 5.5h15v14h-15z"/><path d="M8 3.5v4"/><path d="M16 3.5v4"/><path d="M4.5 9.5h15"/><path d="M12 12.6l.7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2z"/>',
		challenge:
			'<path d="M6 21V3.5"/><path d="M6 5h11l-2.6 3.6L17 12H6"/>',
		founder:
			'<path d="M12 3.5l7.5 3v5.2c0 4.5-3 8-7.5 9.3-4.5-1.3-7.5-4.8-7.5-9.3V6.5z"/><path d="M9 12.2l2.2 2.2 4-4.3"/>',
		admin:
			'<path d="M12 3.5l7.5 3v5.2c0 4.5-3 8-7.5 9.3-4.5-1.3-7.5-4.8-7.5-9.3V6.5z"/><path d="M8.5 12l2.5 2.5 5-5.5"/>',
		season:
			'<path d="M6 4v16"/><path d="M18 4v16"/><path d="M6 5h9.5a3.5 3.5 0 0 1 0 7H9a3.5 3.5 0 0 0 0 7h9.5"/>',
		gift:
			'<path d="M4 9.5h16v10.5H4z"/><path d="M12 9.5V20"/><path d="M4.5 13.5h15"/><path d="M12 9.5c-1.8 0-3.2-1-3.2-2.5S10.2 4 12 5.5c-1.8-1.5-3.2-.5-3.2 1.5S10.2 9.5 12 9.5z"/>',
		book:
			'<path d="M4.5 5A2.5 2.5 0 0 1 7 2.5h12.5V19H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 5v16.5"/><path d="M8.5 6.5h7.5"/><path d="M8.5 10h5"/>',
		key: '<circle cx="8" cy="15.5" r="4.5"/><path d="M11.5 12 20 3.5"/><path d="M16 8l3 3"/><path d="M18.5 5.5L20 7"/>',
		logout: '<path d="M14.5 4H5.5a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 5.5 20h9"/><path d="M16.5 7.5 20 12l-3.5 4.5"/><path d="M20 12H9.5"/>',
		moon: '<path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z"/>',
		sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>'
	};

	let { name, class: className = '', size = 18 }: { name: VellumIconName; class?: string; size?: number } =
		$props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{@html ICONS[name]}
</svg>
