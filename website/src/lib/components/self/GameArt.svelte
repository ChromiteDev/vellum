<script lang="ts">
	export type GameKey = 'coinflip' | 'slots' | 'mines' | 'dice' | 'tower' | 'wheel';

	let { game, class: className = '' }: { game: GameKey; class?: string } = $props();
</script>

{#if game === 'coinflip'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="ca" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/>
			</linearGradient>
			<linearGradient id="cb" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#e2e8f0"/><stop offset="1" stop-color="#94a3b8"/>
			</linearGradient>
		</defs>
		<path d="M20 78 Q60 30 100 78" stroke="url(#cb)" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
		<circle cx="42" cy="78" r="24" fill="url(#ca)"/>
		<circle cx="42" cy="78" r="24" stroke="#b45309" stroke-width="2.5"/>
		<path d="M42 62 l3.5 7.5 8 1.2 -6 5.6 1.5 8 -7 -3.6 -7 3.6 1.5 -8 -6 -5.6 8 -1.2 z" fill="#78350f"/>
		<circle cx="78" cy="78" r="24" fill="url(#cb)"/>
		<circle cx="78" cy="78" r="24" stroke="#475569" stroke-width="2.5"/>
		<path d="M78 64 l2.4 5 5.6 0.8 -4 4 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -4 5.6 -0.8 z" fill="#334155"/>
		<path d="M60 42 l4.5 4.5" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>
		<path d="M66 36 l4.5 4.5" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round"/>
	</svg>
{:else if game === 'slots'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="sl" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/>
			</linearGradient>
		</defs>
		<rect x="14" y="10" width="92" height="100" rx="12" fill="#171722" stroke="url(#sl)" stroke-width="3"/>
		<rect x="22" y="18" width="76" height="84" rx="8" fill="#0d0d14"/>
		<rect x="26" y="22" width="22" height="44" rx="4" fill="url(#sl)" opacity="0.85"/>
		<rect x="49" y="22" width="22" height="44" rx="4" fill="url(#sl)" opacity="0.55"/>
		<rect x="72" y="22" width="22" height="44" rx="4" fill="url(#sl)" opacity="0.85"/>
		<path d="M26 66 h68 v4 a4 4 0 0 1 -4 4 H30 a4 4 0 0 1 -4 -4 z" fill="#fbbf24"/>
		<path d="M40 74 h40 l-3 10 H43 z" fill="#f59e0b"/>
		<path d="M52 42 l2.4 5 5.6 0.8 -4 4 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -4 5.6 -0.8 z" fill="#fff" opacity="0.9"/>
		<circle cx="60" cy="42" r="1.6" fill="#8b5cf6"/>
		<path d="M83 40 l1.8 3.8 4.2 0.6 -3 2.8 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.8 4.2 -.6 z" fill="#fff" opacity="0.9"/>
		<path d="M38 50 l1.8 3.8 4.2 0.6 -3 2.8 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -2.8 4.2 -.6 z" fill="#fff" opacity="0.9"/>
	</svg>
{:else if game === 'mines'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#c4b5fd"/><stop offset="1" stop-color="#6366f1"/>
			</linearGradient>
			<radialGradient id="mgr" cx="0.5" cy="0.5" r="0.5">
				<stop offset="0" stop-color="#8b5cf6" stop-opacity="0.5"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/>
			</radialGradient>
		</defs>
		<rect x="10" y="10" width="100" height="100" rx="14" fill="#13131c"/>
		<rect x="10" y="10" width="100" height="100" rx="14" fill="url(#mgr)"/>
		<g>
			<rect x="16" y="16" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="16" y="47.5" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="16" y="79" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="47.5" y="16" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="47.5" y="47.5" width="25" height="25" rx="6" fill="#1b1b2e"/>
			<rect x="47.5" y="79" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="79" y="16" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="79" y="47.5" width="25" height="25" rx="6" fill="#23233a"/>
			<rect x="79" y="79" width="25" height="25" rx="6" fill="#23233a"/>
		</g>
		<path d="M14 36 l14 -8 M28 36 l-14 -8" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>
		<path d="M14 36 h14 M28 36 v-8 M14 36 v-8" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/>
		<circle cx="21" cy="33" r="1.8" fill="#fde68a"/>
		<circle cx="28" cy="26" r="1.4" fill="#fde68a"/>
		<path d="M16 24 h6 v6 h-6 z" fill="url(#mg)"/>
		<circle cx="44" cy="24" r="2" fill="#a78bfa"/>
		<circle cx="60" cy="38" r="2" fill="#a78bfa"/>
		<circle cx="92" cy="24" r="2" fill="#a78bfa"/>
	</svg>
{:else if game === 'dice'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="dg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#fde68a"/><stop offset="1" stop-color="#f59e0b"/>
			</linearGradient>
		</defs>
		<path d="M30 90 Q60 40 90 90" stroke="#8b5cf6" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
		<rect x="30" y="20" width="60" height="60" rx="14" fill="url(#dg)" stroke="#b45309" stroke-width="2.5"/>
		<circle cx="48" cy="38" r="4.5" fill="#78350f"/>
		<circle cx="72" cy="38" r="4.5" fill="#78350f"/>
		<circle cx="60" cy="50" r="4.5" fill="#78350f"/>
		<circle cx="48" cy="62" r="4.5" fill="#78350f"/>
		<circle cx="72" cy="62" r="4.5" fill="#78350f"/>
		<path d="M96 32 l3 6.5 7 1 -5 5 1.2 7 -6.2 -3.2 -6.2 3.2 1.2 -7 -5 -5 7 -1 z" fill="#8b5cf6"/>
	</svg>
{:else if game === 'tower'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/>
			</linearGradient>
		</defs>
		<rect x="10" y="10" width="100" height="100" rx="14" fill="#13131c"/>
		<g stroke="url(#tg)" stroke-width="3" stroke-linecap="round">
			<path d="M24 96 h72"/>
			<path d="M32 82 h56"/>
			<path d="M40 68 h40"/>
			<path d="M48 54 h24"/>
		</g>
		<path d="M60 44 l-4 10 M60 44 l4 10" stroke="#a78bfa" stroke-width="3" stroke-linecap="round"/>
		<path d="M56 40 h8 v4 h-8 z" fill="url(#tg)"/>
		<path d="M60 30 l1.6 3.4 3.4 1.6 -3.4 1.6 L60 40 l-1.6 -3.4 L55 35 l3.4 -1.6 z" fill="#fbbf24"/>
	</svg>
{:else if game === 'wheel'}
	<svg viewBox="0 0 120 120" fill="none" class={className} aria-hidden="true">
		<defs>
			<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/>
			</linearGradient>
		</defs>
		<circle cx="60" cy="60" r="46" fill="#171722" stroke="url(#wg)" stroke-width="4"/>
		<g>
			<path d="M60 60 L60 14 A46 46 0 0 1 92.5 27.5 Z" fill="#8b5cf6" opacity="0.85"/>
			<path d="M60 60 L92.5 27.5 A46 46 0 0 1 106 60 Z" fill="#6366f1" opacity="0.85"/>
			<path d="M60 60 L106 60 A46 46 0 0 1 92.5 92.5 Z" fill="#a78bfa" opacity="0.85"/>
			<path d="M60 60 L92.5 92.5 A46 46 0 0 1 60 106 Z" fill="#8b5cf6" opacity="0.6"/>
			<path d="M60 60 L60 106 A46 46 0 0 1 27.5 92.5 Z" fill="#6366f1" opacity="0.6"/>
			<path d="M60 60 L27.5 92.5 A46 46 0 0 1 14 60 Z" fill="#a78bfa" opacity="0.6"/>
			<path d="M60 60 L14 60 A46 46 0 0 1 27.5 27.5 Z" fill="#8b5cf6" opacity="0.5"/>
			<path d="M60 60 L27.5 27.5 A46 46 0 0 1 60 14 Z" fill="#6366f1" opacity="0.5"/>
		</g>
		<circle cx="60" cy="60" r="9" fill="#0d0d14" stroke="#fde68a" stroke-width="2.5"/>
		<path d="M88 10 l8 6 -8 6 z" fill="#fbbf24"/>
	</svg>
{/if}
