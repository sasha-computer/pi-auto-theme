/**
 * Auto-switches pi theme based on macOS system appearance (dark/light mode),
 * and syncs Ghostty and tmux to match.
 *
 * Supports five theme pairs:
 *   - catppuccin (default): catppuccin-mocha / catppuccin-latte
 *   - catppuccin-macchiato: catppuccin-macchiato / catppuccin-latte
 *   - catppuccin-frappe: catppuccin-frappe / catppuccin-latte
 *   - everforest: everforest-dark / everforest-light
 *   - high-contrast: high-contrast-dark / high-contrast-light
 *
 * Commands:
 *   /theme                    -- Open interactive picker (Auto / Dark / Light sections)
 *   /theme <pair>             -- Switch to a pair in auto mode (follows system dark/light)
 *   /theme <individual-name>  -- Pin to a specific theme regardless of system mode
 *
 * Polls macOS appearance every 2 seconds and switches pi + tmux automatically,
 * unless a theme is pinned (forced regardless of system mode). Ghostty uses its
 * native light:/dark: syntax in auto mode, or a single theme name when pinned.
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
import { DynamicBorder } from "@mariozechner/pi-coding-agent";
import { Container, type SelectItem, SelectList, Text } from "@mariozechner/pi-tui";
import {
	THEME_PAIRS,
	PAIR_NAMES,
	DARK_THEMES,
	LIGHT_THEMES,
	PI_TO_GHOSTTY,
	resolveTheme,
	rewriteGhosttyConfig,
	rewriteGhosttyConfigPinned,
	validatePairName,
	type ThemePair,
} from "./theme-logic";

const execAsync = promisify(exec);

const HOME = process.env.HOME ?? "";
const GHOSTTY_CONFIG = `${HOME}/.config/ghostty/config`;
const GHOSTTY_THEMES_DIR = `${HOME}/.config/ghostty/themes`;
const TMUX_THEMES_DIR = `${HOME}/.config/tmux/themes`;
const TMUX_THEME_FILE = `${HOME}/.config/tmux/theme.conf`;
const PAIR_STATE_FILE = `${HOME}/.pi/agent/theme-pair-state.json`;

// Resolved paths to bundled assets (sibling of extensions/)
const __filename = fileURLToPath(import.meta.url);
const BUNDLED_TMUX_THEMES = resolve(dirname(__filename), "../tmux-themes");

// Ghostty theme definitions -- same hex values as the pi themes
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

interface PersistedState {
	pair: string;
	pinned: string | null;
}

async function loadPersistedState(): Promise<PersistedState | null> {
	try {
		const data = JSON.parse(await readFile(PAIR_STATE_FILE, "utf-8"));
		const pair = data?.pair && THEME_PAIRS[data.pair] ? data.pair : null;
		if (!pair) return null;
		const pinned = data?.pinned && PI_TO_GHOSTTY[data.pinned] ? data.pinned : null;
		return { pair, pinned };
	} catch {
		return null;
	}
}

async function persistState(pair: string, pinned: string | null): Promise<void> {
	await mkdir(dirname(PAIR_STATE_FILE), { recursive: true });
	await writeFile(PAIR_STATE_FILE, JSON.stringify({ pair, pinned }), "utf-8");
}

async function installGhosttyThemes(): Promise<void> {
	if (!(await exists(`${HOME}/.config/ghostty`))) return;

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
			// Source file missing -- skip silently
		}
	}
}

async function syncTmux(themeName: string): Promise<void> {
	const src = `${TMUX_THEMES_DIR}/${themeName}.conf`;
	try {
		const content = await readFile(src, "utf-8");
		await writeFile(TMUX_THEME_FILE, content, "utf-8");
		await execAsync("tmux source-file ~/.config/tmux/theme.conf").catch(() => {});
	} catch {
		// Theme file missing or tmux not installed -- skip silently
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
		const updated = rewriteGhosttyConfig(config, pair);

		if (updated === config) return;

		await writeFile(GHOSTTY_CONFIG, updated, "utf-8");

		await execAsync(
			'osascript -e \'tell application "System Events" to tell process "Ghostty" to click menu item "Reload Configuration" of menu "Ghostty" of menu bar item "Ghostty" of menu bar 1\'',
		).catch(() => {});
	} catch {
		// Config file missing or not writable -- silently skip
	}
}

async function updateGhosttyThemePinned(ghosttyTheme: string): Promise<void> {
	try {
		const config = await readFile(GHOSTTY_CONFIG, "utf-8");
		const updated = rewriteGhosttyConfigPinned(config, ghosttyTheme);

		if (updated === config) return;

		await writeFile(GHOSTTY_CONFIG, updated, "utf-8");

		await execAsync(
			'osascript -e \'tell application "System Events" to tell process "Ghostty" to click menu item "Reload Configuration" of menu "Ghostty" of menu bar item "Ghostty" of menu bar 1\'',
		).catch(() => {});
	} catch {
		// Config file missing or not writable -- silently skip
	}
}

// Preview a specific theme name in the picker -- never writes to Ghostty or
// tmux, avoiding file corruption from rapid concurrent writes.
function previewPiTheme(
	themeName: string,
	ctx: { ui: { setTheme: (name: string) => unknown } },
): void {
	ctx.ui.setTheme(themeName);
}

// Apply a pair in auto mode: pi + Ghostty light/dark pair + tmux, following system mode.
async function applyAutoPair(
	pairName: string,
	ctx: { ui: { setTheme: (name: string) => unknown } },
): Promise<void> {
	const dark = await isDarkMode();
	const resolved = resolveTheme(pairName, dark);
	ctx.ui.setTheme(resolved.piTheme);
	await updateGhosttyTheme(THEME_PAIRS[pairName]);
	await syncTmux(resolved.tmuxTheme);
}

// Apply a pinned theme: forces pi + Ghostty + tmux to a specific theme
// regardless of system dark/light mode.
async function applyPinnedTheme(
	themeName: string,
	ctx: { ui: { setTheme: (name: string) => unknown } },
): Promise<void> {
	ctx.ui.setTheme(themeName);
	await syncTmux(themeName);
	const ghosttyTheme = PI_TO_GHOSTTY[themeName];
	if (ghosttyTheme) await updateGhosttyThemePinned(ghosttyTheme);
}

export default function (pi: ExtensionAPI) {
	let intervalId: ReturnType<typeof setInterval> | null = null;
	let currentPair = "catppuccin";
	let pinnedTheme: string | null = null; // if set, ignore system mode and use this theme
	let currentAppliedTheme = "";

	async function applyTheme(ctx: { ui: { setTheme: (name: string) => unknown } }) {
		let piTheme: string;
		let tmuxTheme: string;

		if (pinnedTheme) {
			piTheme = pinnedTheme;
			tmuxTheme = pinnedTheme;
		} else {
			const dark = await isDarkMode();
			const resolved = resolveTheme(currentPair, dark);
			piTheme = resolved.piTheme;
			tmuxTheme = resolved.tmuxTheme;
		}

		if (piTheme !== currentAppliedTheme) {
			currentAppliedTheme = piTheme;
			ctx.ui.setTheme(piTheme);
			await syncTmux(tmuxTheme);
		}
	}

	pi.on("session_start", async (_event, ctx) => {
		await installGhosttyThemes();
		await installTmuxThemes();

		const saved = await loadPersistedState();
		if (saved) {
			currentPair = saved.pair;
			pinnedTheme = saved.pinned;
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

	pi.registerCommand("theme", {
		description: "Switch theme (interactive picker or /theme <name>)",
		getArgumentCompletions: (prefix: string) => {
			const allNames = [
				...PAIR_NAMES,
				...DARK_THEMES,
				...LIGHT_THEMES,
			];
			const items = allNames.map((name) => ({ value: name, label: name }));
			const filtered = items.filter((i) => i.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : null;
		},
		handler: async (args, ctx) => {
			const name = args?.trim();

			// Direct switch: /theme <name>
			if (name) {
				if (THEME_PAIRS[name]) {
					// Pair name -- switch to auto mode for this pair
					pinnedTheme = null;
					currentPair = name;
					currentAppliedTheme = "";
					await persistState(currentPair, null);
					await applyAutoPair(name, ctx);
					ctx.ui.notify(`Theme: ${name} (auto)`, "info");
				} else if (PI_TO_GHOSTTY[name]) {
					// Individual theme -- pin to it
					pinnedTheme = name;
					currentAppliedTheme = "";
					await persistState(currentPair, pinnedTheme);
					await applyPinnedTheme(name, ctx);
					ctx.ui.notify(`Theme: ${name} (pinned)`, "info");
				} else {
					const available = [...PAIR_NAMES, ...DARK_THEMES, ...LIGHT_THEMES].join(", ");
					ctx.ui.notify(`Unknown theme "${name}". Available: ${available}`, "error");
				}
				return;
			}

			// Interactive picker with three sections: Auto, Dark, Light
			const previousPair = currentPair;
			const previousPinned = pinnedTheme;

			// Sentinel prefix for section header items (non-selectable)
			const H = "§";

			const items: SelectItem[] = [
				{ value: `${H}auto`, label: "── Auto  follows system ──────────────────────" },
				...PAIR_NAMES.map((pairName) => {
					const pair = THEME_PAIRS[pairName];
					return {
						value: `auto:${pairName}`,
						label: pairName,
						description: `${pair.dark} (dark) / ${pair.light} (light)`,
					};
				}),
				{ value: `${H}dark`, label: "── Dark ──────────────────────────────────────" },
				...DARK_THEMES.map((themeName) => ({ value: `pin:${themeName}`, label: themeName })),
				{ value: `${H}light`, label: "── Light ─────────────────────────────────────" },
				...LIGHT_THEMES.map((themeName) => ({ value: `pin:${themeName}`, label: themeName })),
			];

			// Pre-select current item
			const currentValue = pinnedTheme ? `pin:${pinnedTheme}` : `auto:${currentPair}`;
			const currentIndex = items.findIndex((i) => i.value === currentValue);

			const selected = await ctx.ui.custom<string | null>((tui, theme, _kb, done) => {
				const container = new Container();

				container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));
				container.addChild(new Text(theme.fg("accent", theme.bold("Theme")), 1, 0));

				const selectList = new SelectList(items, Math.min(items.length, 12), {
					selectedPrefix: (t) => theme.fg("accent", t),
					selectedText: (t) => theme.fg("accent", t),
					description: (t) => theme.fg("muted", t),
					scrollInfo: (t) => theme.fg("dim", t),
					noMatch: (t) => theme.fg("warning", t),
				});

				if (currentIndex >= 0) {
					selectList.setSelectedIndex(currentIndex);
				}

				// Live preview -- pi theme only, no Ghostty writes
				selectList.onSelectionChange = (item) => {
					if (item.value.startsWith(H)) return; // section header, skip
					if (item.value.startsWith("auto:")) {
						// Preview the dark variant so Catppuccin flavours are distinguishable
						const pairName = item.value.slice(5);
						const pair = THEME_PAIRS[pairName];
						if (pair) previewPiTheme(pair.dark, ctx);
					} else if (item.value.startsWith("pin:")) {
						previewPiTheme(item.value.slice(4), ctx);
					}
				};

				// Don't close the picker when a section header is selected
				selectList.onSelect = (item) => {
					if (item.value.startsWith(H)) return;
					done(item.value);
				};
				selectList.onCancel = () => done(null);
				container.addChild(selectList);

				container.addChild(
					new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 1, 0),
				);
				container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

				return {
					render: (w) => container.render(w),
					invalidate: () => container.invalidate(),
					handleInput: (data) => {
						selectList.handleInput(data);
						tui.requestRender();
					},
				};
			});

			if (selected) {
				currentAppliedTheme = "";
				if (selected.startsWith("auto:")) {
					const pairName = selected.slice(5);
					pinnedTheme = null;
					currentPair = pairName;
					await persistState(currentPair, null);
					await applyAutoPair(pairName, ctx);
					ctx.ui.notify(`Theme: ${pairName} (auto)`, "info");
				} else if (selected.startsWith("pin:")) {
					const themeName = selected.slice(4);
					pinnedTheme = themeName;
					await persistState(currentPair, themeName);
					await applyPinnedTheme(themeName, ctx);
					ctx.ui.notify(`Theme: ${themeName} (pinned)`, "info");
				}
			} else {
				// Cancelled -- revert to previous state
				pinnedTheme = previousPinned;
				currentPair = previousPair;
				currentAppliedTheme = "";
				if (previousPinned) {
					await applyPinnedTheme(previousPinned, ctx);
				} else {
					await applyAutoPair(previousPair, ctx);
				}
			}
		},
	});
}
