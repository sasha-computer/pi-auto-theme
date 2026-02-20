/** All individual theme names. */
export const ALL_THEMES = [
	"catppuccin-mocha",
	"catppuccin-macchiato",
	"catppuccin-frappe",
	"catppuccin-latte",
	"everforest-dark",
	"everforest-light",
	"high-contrast-dark",
	"high-contrast-light",
] as const;

export type ThemeName = (typeof ALL_THEMES)[number];

export const DARK_THEMES: ThemeName[] = [
	"catppuccin-mocha",
	"catppuccin-macchiato",
	"catppuccin-frappe",
	"everforest-dark",
	"high-contrast-dark",
];

export const LIGHT_THEMES: ThemeName[] = [
	"catppuccin-latte",
	"everforest-light",
	"high-contrast-light",
];

/** Map from pi theme name to Ghostty theme name. */
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

export function isValidTheme(name: string): name is ThemeName {
	return (ALL_THEMES as readonly string[]).includes(name);
}

/**
 * Rewrite a Ghostty config string to use the given theme.
 * Returns the config unchanged if no `theme = ...` line exists.
 */
export function rewriteGhosttyConfig(config: string, ghosttyTheme: string): string {
	return config.replace(/^theme\s*=\s*.+$/m, `theme = ${ghosttyTheme}`);
}
