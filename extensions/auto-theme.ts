/**
 * Auto-switches pi theme based on macOS system appearance (dark/light mode),
 * and syncs the Ghostty terminal theme to match.
 *
 * Supports five theme pairs:
 *   - catppuccin (default): catppuccin-mocha / catppuccin-latte
 *   - catppuccin-macchiato: catppuccin-macchiato / catppuccin-latte
 *   - catppuccin-frappe: catppuccin-frappe / catppuccin-latte
 *   - everforest: everforest-dark / everforest-light
 *   - high-contrast: high-contrast-dark / high-contrast-light
 *
 * Commands:
 *   /theme-pair <name>  — Switch theme pair (catppuccin, everforest, high-contrast)
 *   /theme-pair         — Show current theme pair
 *
 * Polls macOS appearance every 2 seconds and switches pi theme automatically.
 * Ghostty uses its native light:/dark: syntax with window-theme = auto, so it
 * auto-switches on its own — we just update which themes are configured when
 * the pair changes.
 *
 * On first run, installs matching Ghostty themes to ~/.config/ghostty/themes/
 * so that the terminal palette matches the pi theme exactly.
 */

import { exec } from "node:child_process";
import { readFile, writeFile, mkdir, access, copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const execAsync = promisify(exec);

const HOME = process.env.HOME ?? "";
const GHOSTTY_CONFIG = `${HOME}/.config/ghostty/config`;
const GHOSTTY_THEMES_DIR = `${HOME}/.config/ghostty/themes`;
const TMUX_THEMES_DIR = `${HOME}/.config/tmux/themes`;
const TMUX_THEME_FILE = `${HOME}/.config/tmux/theme.conf`;
const PAIR_STATE_FILE = `${HOME}/.pi/agent/theme-pair-state.json`;

// Resolved path to bundled tmux themes (sibling of extensions/)
const __filename = fileURLToPath(import.meta.url);
const BUNDLED_TMUX_THEMES = resolve(dirname(__filename), "../tmux-themes");

interface ThemePair {
	dark: string;
	light: string;
	ghosttyDark: string;
	ghosttyLight: string;
}

const THEME_PAIRS: Record<string, ThemePair> = {
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

const PAIR_NAMES = Object.keys(THEME_PAIRS);

// Ghostty theme definitions — same hex values as the pi themes
const GHOSTTY_THEMES: Record<string, string> = {
	"Catppuccin Mocha Sync": `palette = 0=#45475a
palette = 1=#f38ba8
palette = 2=#a6e3a1
palette = 3=#f9e2af
palette = 4=#89b4fa
palette = 5=#f5c2e7
palette = 6=#94e2d5
palette = 7=#a6adc8
palette = 8=#585b70
palette = 9=#f38ba8
palette = 10=#a6e3a1
palette = 11=#f9e2af
palette = 12=#89b4fa
palette = 13=#f5c2e7
palette = 14=#94e2d5
palette = 15=#bac2de
background = #1e1e2e
foreground = #cdd6f4
cursor-color = #f5e0dc
cursor-text = #1e1e2e
selection-background = #585b70
selection-foreground = #cdd6f4
`,
	"Catppuccin Latte Sync": `palette = 0=#5c5f77
palette = 1=#d20f39
palette = 2=#40a02b
palette = 3=#df8e1d
palette = 4=#1e66f5
palette = 5=#ea76cb
palette = 6=#179299
palette = 7=#acb0be
palette = 8=#6c6f85
palette = 9=#d20f39
palette = 10=#40a02b
palette = 11=#df8e1d
palette = 12=#1e66f5
palette = 13=#ea76cb
palette = 14=#179299
palette = 15=#bcc0cc
background = #eff1f5
foreground = #4c4f69
cursor-color = #dc8a78
cursor-text = #eff1f5
selection-background = #acb0be
selection-foreground = #4c4f69
`,
	"Catppuccin Macchiato Sync": `palette = 0=#45475a
palette = 1=#f38ba8
palette = 2=#a6e3a1
palette = 3=#f9e2af
palette = 4=#89b4fa
palette = 5=#c6a1ed
palette = 6=#8bd5ca
palette = 7=#cdd6f4
palette = 8=#6c7086
palette = 9=#f38ba8
palette = 10=#a6e3a1
palette = 11=#f9e2af
palette = 12=#89b4fa
palette = 13=#c6a1ed
palette = 14=#8bd5ca
palette = 15=#b4befe
background = #24273a
foreground = #cdd6f4
cursor-color = #f4dbd6
cursor-text = #24273a
selection-background = #45475a
selection-foreground = #cdd6f4
`,
	"Catppuccin Frappe Sync": `palette = 0=#737994
palette = 1=#e78284
palette = 2=#a6d189
palette = 3=#eed49f
palette = 4=#8caaee
palette = 5=#ca9ee6
palette = 6=#8dd5c1
palette = 7=#c6d0f5
palette = 8=#949cbb
palette = 9=#e78284
palette = 10=#a6d189
palette = 11=#eed49f
palette = 12=#8caaee
palette = 13=#ca9ee6
palette = 14=#8dd5c1
palette = 15=#babbf1
background = #585b70
foreground = #c6d0f5
cursor-color = #f2d8cf
cursor-text = #585b70
selection-background = #737994
selection-foreground = #c6d0f5
`,
	"Everforest Dark": `palette = 0=#7a8478
palette = 1=#e67e80
palette = 2=#a7c080
palette = 3=#dbbc7f
palette = 4=#7fbbb3
palette = 5=#d699b6
palette = 6=#83c092
palette = 7=#d3c6aa
palette = 8=#859289
palette = 9=#f85552
palette = 10=#8da101
palette = 11=#dfa000
palette = 12=#3a94c5
palette = 13=#df69ba
palette = 14=#35a77c
palette = 15=#9da9a0
background = #2d353b
foreground = #d3c6aa
cursor-color = #e69875
cursor-text = #2d353b
selection-background = #543a48
selection-foreground = #d3c6aa
`,
	"Everforest Light": `palette = 0=#5c6a72
palette = 1=#f85552
palette = 2=#8da101
palette = 3=#dfa000
palette = 4=#3a94c5
palette = 5=#df69ba
palette = 6=#35a77c
palette = 7=#e6e2cc
palette = 8=#829181
palette = 9=#e67e80
palette = 10=#a7c080
palette = 11=#dbbc7f
palette = 12=#7fbbb3
palette = 13=#d699b6
palette = 14=#83c092
palette = 15=#fdf6e3
background = #fdf6e3
foreground = #5c6a72
cursor-color = #f57d26
cursor-text = #fdf6e3
selection-background = #eaedc8
selection-foreground = #5c6a72
`,
	"High Contrast Dark": `palette = 0=#444444
palette = 1=#ff3333
palette = 2=#00ff00
palette = 3=#ffff00
palette = 4=#5599ff
palette = 5=#ff55ff
palette = 6=#00ffff
palette = 7=#cccccc
palette = 8=#666666
palette = 9=#ff3333
palette = 10=#00ff00
palette = 11=#ffff00
palette = 12=#5599ff
palette = 13=#ff55ff
palette = 14=#00ffff
palette = 15=#ffffff
background = #000000
foreground = #ffffff
cursor-color = #00ffff
cursor-text = #000000
selection-background = #1a1a2e
selection-foreground = #ffffff
`,
	"High Contrast Light": `palette = 0=#000000
palette = 1=#cc0000
palette = 2=#006600
palette = 3=#997700
palette = 4=#0000cc
palette = 5=#880088
palette = 6=#006666
palette = 7=#999999
palette = 8=#333333
palette = 9=#cc0000
palette = 10=#006600
palette = 11=#997700
palette = 12=#0000cc
palette = 13=#880088
palette = 14=#006666
palette = 15=#cccccc
background = #ffffff
foreground = #000000
cursor-color = #0000cc
cursor-text = #ffffff
selection-background = #d0d0ff
selection-foreground = #000000
`,
};

async function exists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

async function loadPersistedPair(): Promise<string | null> {
	try {
		const data = JSON.parse(await readFile(PAIR_STATE_FILE, "utf-8"));
		return data?.pair && THEME_PAIRS[data.pair] ? data.pair : null;
	} catch {
		return null;
	}
}

async function persistPair(pair: string): Promise<void> {
	await mkdir(dirname(PAIR_STATE_FILE), { recursive: true });
	await writeFile(PAIR_STATE_FILE, JSON.stringify({ pair }), "utf-8");
}

async function installGhosttyThemes(): Promise<void> {
	if (!(await exists(`${HOME}/.config/ghostty`))) return; // Ghostty not installed

	await mkdir(GHOSTTY_THEMES_DIR, { recursive: true });

	for (const [name, content] of Object.entries(GHOSTTY_THEMES)) {
		const path = `${GHOSTTY_THEMES_DIR}/${name}`;
		if (!(await exists(path))) {
			await writeFile(path, content, "utf-8");
		}
	}
}

async function installTmuxThemes(): Promise<void> {
	const themeNames = [
		"catppuccin-mocha",
		"catppuccin-latte",
		"catppuccin-macchiato",
		"catppuccin-frappe",
		"everforest-dark",
		"everforest-light",
		"high-contrast-dark",
		"high-contrast-light",
	];

	await mkdir(TMUX_THEMES_DIR, { recursive: true });

	for (const name of themeNames) {
		const src = `${BUNDLED_TMUX_THEMES}/${name}.conf`;
		const dst = `${TMUX_THEMES_DIR}/${name}.conf`;
		try {
			await copyFile(src, dst);
		} catch {
			// Source file missing — skip silently
		}
	}
}

async function syncTmux(themeName: string): Promise<void> {
	const src = `${TMUX_THEMES_DIR}/${themeName}.conf`;
	try {
		const content = await readFile(src, "utf-8");
		await writeFile(TMUX_THEME_FILE, content, "utf-8");
		// Apply to running tmux server if one exists
		await execAsync("tmux source-file ~/.config/tmux/theme.conf").catch(() => {});
	} catch {
		// Theme file missing or tmux not installed — skip silently
	}
}

async function isDarkMode(): Promise<boolean> {
	try {
		const { stdout } = await execAsync(
			'osascript -e \'tell application "System Events" to tell appearance preferences to return dark mode\'',
		);
		return stdout.trim() === "true";
	} catch {
		return false;
	}
}

async function updateGhosttyTheme(pair: ThemePair): Promise<void> {
	try {
		const config = await readFile(GHOSTTY_CONFIG, "utf-8");
		const newThemeLine = `theme = light:${pair.ghosttyLight},dark:${pair.ghosttyDark}`;

		// Replace existing theme line (handles both `theme = X` and `theme = light:X,dark:Y`)
		const updated = config.replace(/^theme\s*=\s*.+$/m, newThemeLine);

		if (updated === config) return; // no change needed

		await writeFile(GHOSTTY_CONFIG, updated, "utf-8");

		// Trigger Ghostty config reload via AppleScript menu click
		await execAsync(
			'osascript -e \'tell application "System Events" to tell process "Ghostty" to click menu item "Reload Configuration" of menu "Ghostty" of menu bar item "Ghostty" of menu bar 1\'',
		).catch(() => {
			// Ghostty might not be running or accessible — that's fine
		});
	} catch {
		// Config file missing or not writable — silently skip
	}
}

export default function (pi: ExtensionAPI) {
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let currentPair = "catppuccin";
	let currentAppliedTheme = "";

	async function applyTheme(ctx: { ui: { setTheme: (name: string) => unknown } }) {
		const dark = await isDarkMode();
		const pair = THEME_PAIRS[currentPair];
		const themeName = dark ? pair.dark : pair.light;

		if (themeName !== currentAppliedTheme) {
			currentAppliedTheme = themeName;
			ctx.ui.setTheme(themeName);
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		// Install Ghostty themes if needed (idempotent, skips existing files)
		await installGhosttyThemes();

		// Restore persisted pair from state file
		const savedPair = await loadPersistedPair();
		if (savedPair) {
			currentPair = savedPair;
		}

		await applyTheme(ctx);

		intervalId = setInterval(async () => {
			await applyTheme(ctx);
		}, 2000);
	});

	pi.on("session_shutdown", () => {
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}
	});

	pi.registerCommand("theme-pair", {
		description: "Switch theme pair (catppuccin, catppuccin-macchiato, catppuccin-frappe, everforest, high-contrast)",
		getArgumentCompletions: (prefix: string) => {
			const items = PAIR_NAMES.map((name) => ({ value: name, label: name }));
			const filtered = items.filter((i) => i.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : null;
		},
		handler: async (args, ctx) => {
			const name = args?.trim();

			if (!name) {
				const mode = (await isDarkMode()) ? "dark" : "light";
				const active = mode === "dark" ? THEME_PAIRS[currentPair].dark : THEME_PAIRS[currentPair].light;
				ctx.ui.notify(`Theme pair: ${currentPair} (${active}, ${mode} mode)`, "info");
				return;
			}

			if (!THEME_PAIRS[name]) {
				ctx.ui.notify(`Unknown pair "${name}". Available: ${PAIR_NAMES.join(", ")}`, "error");
				return;
			}

			currentPair = name;
			currentAppliedTheme = ""; // Force re-apply
			await persistPair(currentPair);

			await applyTheme(ctx);
			await updateGhosttyTheme(THEME_PAIRS[name]);

			ctx.ui.notify(`Theme pair: ${name} (pi + Ghostty synced)`, "info");
		},
	});
}
