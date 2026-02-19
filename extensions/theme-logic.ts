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
