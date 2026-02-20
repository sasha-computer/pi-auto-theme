/**
 * Theme switcher for pi, Ghostty, and tmux.
 *
 * Pick a theme with `/theme` and it sticks -- across reloads, restarts,
 * everything. Ghostty and tmux are synced to match.
 *
 * Themes:
 *   catppuccin-mocha, catppuccin-macchiato, catppuccin-frappe, catppuccin-latte,
 *   everforest-dark, everforest-light, high-contrast-dark, high-contrast-light
 *
 * Commands:
 *   /theme              -- Open interactive picker
 *   /theme <name>       -- Switch directly
 *
 * Source of truth: settings.json `"theme"` field. On `/reload`, pi reads
 * settings.json and applies the theme itself, so the extension doesn't need
 * to fight it. Ghostty and tmux configs are written on change and skipped
 * when already correct (no flash on reload).
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
	ALL_THEMES,
	DARK_THEMES,
	LIGHT_THEMES,
	PI_TO_GHOSTTY,
	isValidTheme,
	rewriteGhosttyConfig,
} from "./theme-logic";

const execAsync = promisify(exec);

const HOME = process.env.HOME ?? "";
const GHOSTTY_CONFIG = `${HOME}/.config/ghostty/config`;
const GHOSTTY_THEMES_DIR = `${HOME}/.config/ghostty/themes`;
const TMUX_THEMES_DIR = `${HOME}/.config/tmux/themes`;
const TMUX_THEME_FILE = `${HOME}/.config/tmux/theme.conf`;
const SETTINGS_FILE = `${HOME}/.pi/agent/settings.json`;

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

// ---------------------------------------------------------------------------
// settings.json -- source of truth for pi theme
// ---------------------------------------------------------------------------

async function readSettings(): Promise<Record<string, unknown>> {
	try {
		return JSON.parse(await readFile(SETTINGS_FILE, "utf-8"));
	} catch {
		return {};
	}
}

async function writeThemeToSettings(themeName: string): Promise<void> {
	const settings = await readSettings();
	settings.theme = themeName;
	await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Ghostty
// ---------------------------------------------------------------------------

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

/** Sync Ghostty config. Returns true if the config was changed. */
async function syncGhostty(themeName: string): Promise<boolean> {
	const ghosttyTheme = PI_TO_GHOSTTY[themeName];
	if (!ghosttyTheme) return false;

	try {
		const config = await readFile(GHOSTTY_CONFIG, "utf-8");
		const updated = rewriteGhosttyConfig(config, ghosttyTheme);

		if (updated === config) return false;

		await writeFile(GHOSTTY_CONFIG, updated, "utf-8");
		return true;
	} catch {
		return false;
	}
}

async function reloadGhostty(): Promise<void> {
	await execAsync(
		'osascript -e \'tell application "System Events" to tell process "Ghostty" to click menu item "Reload Configuration" of menu "Ghostty" of menu bar item "Ghostty" of menu bar 1\'',
	).catch(() => {});
}

// ---------------------------------------------------------------------------
// tmux
// ---------------------------------------------------------------------------

async function installTmuxThemes(): Promise<void> {
	const themeNames = ALL_THEMES;

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

/** Sync tmux theme. Returns true if the theme file was changed. */
async function syncTmux(themeName: string): Promise<boolean> {
	const src = `${TMUX_THEMES_DIR}/${themeName}.conf`;
	try {
		const newContent = await readFile(src, "utf-8");

		// Check if already correct
		try {
			const current = await readFile(TMUX_THEME_FILE, "utf-8");
			if (current === newContent) return false;
		} catch {
			// File doesn't exist yet -- continue to write
		}

		await writeFile(TMUX_THEME_FILE, newContent, "utf-8");
		await execAsync("tmux source-file ~/.config/tmux/theme.conf").catch(() => {});
		return true;
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// Apply theme -- sets pi + Ghostty + tmux
// ---------------------------------------------------------------------------

async function applyTheme(
	themeName: string,
	ctx: { ui: { setTheme: (name: string) => unknown } },
): Promise<void> {
	// 1. Write to settings.json so pi's own reload logic uses the right theme
	await writeThemeToSettings(themeName);

	// 2. Set pi theme immediately for the visual change
	ctx.ui.setTheme(themeName);

	// 3. Sync Ghostty -- only triggers AppleScript reload if config actually changed
	const ghosttyChanged = await syncGhostty(themeName);
	if (ghosttyChanged) await reloadGhostty();

	// 4. Sync tmux -- only reloads if theme file actually changed
	await syncTmux(themeName);
}

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, _ctx) => {
		await installGhosttyThemes();
		await installTmuxThemes();

		// Read the current theme from settings.json and ensure Ghostty + tmux match.
		// Pi handles its own theme from settings.json on startup/reload, so we don't
		// call ctx.ui.setTheme() here. We just make sure the external tools are in sync.
		const settings = await readSettings();
		const currentTheme = typeof settings.theme === "string" ? settings.theme : null;

		if (currentTheme && isValidTheme(currentTheme)) {
			const ghosttyChanged = await syncGhostty(currentTheme);
			if (ghosttyChanged) await reloadGhostty();
			await syncTmux(currentTheme);
		}
	});

	pi.registerCommand("theme", {
		description: "Switch theme (interactive picker or /theme <name>)",
		getArgumentCompletions: (prefix: string) => {
			const items = ALL_THEMES.map((name) => ({ value: name, label: name }));
			const filtered = items.filter((i) => i.value.startsWith(prefix));
			return filtered.length > 0 ? filtered : null;
		},
		handler: async (args, ctx) => {
			const name = args?.trim();

			// Direct switch: /theme <name>
			if (name) {
				if (!isValidTheme(name)) {
					ctx.ui.notify(`Unknown theme "${name}". Available: ${ALL_THEMES.join(", ")}`, "error");
					return;
				}
				await applyTheme(name, ctx);
				ctx.ui.notify(`Theme: ${name}`, "info");
				return;
			}

			// Interactive picker with two sections: Dark, Light
			const savedSettings = await readSettings();
			const currentThemeName = typeof savedSettings.theme === "string" ? savedSettings.theme : "";

			// Sentinel prefix for section header items (non-selectable)
			const H = "\u00A7";

			const items: SelectItem[] = [
				{ value: `${H}dark`, label: "\u2500\u2500 Dark \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" },
				...DARK_THEMES.map((t) => ({ value: t, label: t })),
				{ value: `${H}light`, label: "\u2500\u2500 Light \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" },
				...LIGHT_THEMES.map((t) => ({ value: t, label: t })),
			];

			// Pre-select current theme
			const currentIndex = items.findIndex((i) => i.value === currentThemeName);

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

				// Live preview -- pi theme only, no Ghostty/tmux writes
				selectList.onSelectionChange = (item) => {
					if (item.value.startsWith(H)) return;
					ctx.ui.setTheme(item.value);
				};

				selectList.onSelect = (item) => {
					if (item.value.startsWith(H)) return;
					done(item.value);
				};
				selectList.onCancel = () => done(null);
				container.addChild(selectList);

				container.addChild(
					new Text(theme.fg("dim", "\u2191\u2193 navigate \u2022 enter select \u2022 esc cancel"), 1, 0),
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

			if (selected && isValidTheme(selected)) {
				await applyTheme(selected, ctx);
				ctx.ui.notify(`Theme: ${selected}`, "info");
			} else {
				// Cancelled -- restore the previous theme
				if (currentThemeName) {
					ctx.ui.setTheme(currentThemeName);
				}
			}
		},
	});
}
