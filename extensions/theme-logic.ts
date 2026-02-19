export interface ThemePair {
	dark: string;
	light: string;
	ghosttyDark: string;
	ghosttyLight: string;
}

export const THEME_PAIRS: Record<string, ThemePair> = {
	catppuccin: {
		dark: "catppuccin-mocha",
		light: "catppuccin-latte",
		ghosttyDark: "Catppuccin Mocha Sync",
		ghosttyLight: "Catppuccin Latte Sync",
	},
	"catppuccin-macchiato": {
		dark: "catppuccin-macchiato",
		light: "catppuccin-latte",
		ghosttyDark: "Catppuccin Macchiato Sync",
		ghosttyLight: "Catppuccin Latte Sync",
	},
	"catppuccin-frappe": {
		dark: "catppuccin-frappe",
		light: "catppuccin-latte",
		ghosttyDark: "Catppuccin Frappe Sync",
		ghosttyLight: "Catppuccin Latte Sync",
	},
	everforest: {
		dark: "everforest-dark",
		light: "everforest-light",
		ghosttyDark: "Everforest Dark",
		ghosttyLight: "Everforest Light",
	},
	"high-contrast": {
		dark: "high-contrast-dark",
		light: "high-contrast-light",
		ghosttyDark: "High Contrast Dark",
		ghosttyLight: "High Contrast Light",
	},
};

export const PAIR_NAMES = Object.keys(THEME_PAIRS);

// All individual pi theme names, grouped by variant
export const DARK_THEMES = [
	"catppuccin-mocha",
	"catppuccin-macchiato",
	"catppuccin-frappe",
	"everforest-dark",
	"high-contrast-dark",
] as const;

export const LIGHT_THEMES = [
	"catppuccin-latte",
	"everforest-light",
	"high-contrast-light",
] as const;

// Map from pi theme name → Ghostty theme name, used in pinned (single-theme) mode
export const PI_TO_GHOSTTY: Record<string, string> = {
	"catppuccin-mocha": "Catppuccin Mocha Sync",
	"catppuccin-latte": "Catppuccin Latte Sync",
	"catppuccin-macchiato": "Catppuccin Macchiato Sync",
	"catppuccin-frappe": "Catppuccin Frappe Sync",
	"everforest-dark": "Everforest Dark",
	"everforest-light": "Everforest Light",
	"high-contrast-dark": "High Contrast Dark",
	"high-contrast-light": "High Contrast Light",
};

export interface ResolvedTheme {
	piTheme: string;
	ghosttyDark: string;
	ghosttyLight: string;
	tmuxTheme: string;
}

export function resolveTheme(pairName: string, isDark: boolean): ResolvedTheme {
	const pair = THEME_PAIRS[pairName];
	if (!pair) throw new Error(`Unknown pair: ${pairName}`);
	const piTheme = isDark ? pair.dark : pair.light;
	return {
		piTheme,
		ghosttyDark: pair.ghosttyDark,
		ghosttyLight: pair.ghosttyLight,
		tmuxTheme: piTheme,
	};
}

export function rewriteGhosttyConfig(config: string, pair: ThemePair): string {
	const newThemeLine = `theme = light:${pair.ghosttyLight},dark:${pair.ghosttyDark}`;
	const updated = config.replace(/^theme\s*=\s*.+$/m, newThemeLine);
	return updated;
}

// Rewrite Ghostty config with a single pinned theme -- no light/dark auto-switching.
// Used when the user forces a specific dark/light theme regardless of system mode.
export function rewriteGhosttyConfigPinned(config: string, ghosttyTheme: string): string {
	return config.replace(/^theme\s*=\s*.+$/m, `theme = ${ghosttyTheme}`);
}

export type ValidateResult =
	| { ok: true; pair: ThemePair }
	| { ok: false; error: string };

export function validatePairName(name: string): ValidateResult {
	const pair = THEME_PAIRS[name];
	if (pair) {
		return { ok: true, pair };
	}
	return { ok: false, error: `Unknown pair "${name}". Available: ${PAIR_NAMES.join(", ")}` };
}
