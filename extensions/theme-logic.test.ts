import { describe, it, expect } from "bun:test";
import {
	PAIR_NAMES,
	DARK_THEMES,
	LIGHT_THEMES,
	PI_TO_GHOSTTY,
	THEME_PAIRS,
	validatePairName,
	resolveTheme,
	rewriteGhosttyConfig,
	rewriteGhosttyConfigPinned,
} from "./theme-logic";

describe("PAIR_NAMES", () => {
	it("contains all five theme pair names", () => {
		expect(PAIR_NAMES).toEqual([
			"catppuccin",
			"catppuccin-macchiato",
			"catppuccin-frappe",
			"everforest",
			"high-contrast",
		]);
	});
});

describe("validatePairName", () => {
	it("returns the pair for valid names", () => {
		const result = validatePairName("catppuccin");
		expect(result).toEqual({
			ok: true,
			pair: expect.objectContaining({ dark: "catppuccin-mocha", light: "catppuccin-latte" }),
		});
	});

	it("returns an error for invalid names", () => {
		const result = validatePairName("nonexistent");
		expect(result).toEqual({
			ok: false,
			error: expect.stringContaining("nonexistent"),
		});
	});
});

describe("resolveTheme", () => {
	it("returns the dark pi theme when isDark is true", () => {
		const result = resolveTheme("catppuccin", true);
		expect(result.piTheme).toBe("catppuccin-mocha");
	});

	it("returns the light pi theme when isDark is false", () => {
		const result = resolveTheme("catppuccin", false);
		expect(result.piTheme).toBe("catppuccin-latte");
	});

	it("returns correct Ghostty theme names", () => {
		const result = resolveTheme("everforest", true);
		expect(result.ghosttyDark).toBe("Everforest Dark");
		expect(result.ghosttyLight).toBe("Everforest Light");
	});

	it("returns correct tmux theme name for dark mode", () => {
		const result = resolveTheme("catppuccin", true);
		expect(result.tmuxTheme).toBe("catppuccin-mocha");
	});

	it("returns correct tmux theme name for light mode", () => {
		const result = resolveTheme("everforest", false);
		expect(result.tmuxTheme).toBe("everforest-light");
	});
});

describe("DARK_THEMES / LIGHT_THEMES", () => {
	it("dark themes are all distinct", () => {
		expect(new Set(DARK_THEMES).size).toBe(DARK_THEMES.length);
	});

	it("light themes are all distinct", () => {
		expect(new Set(LIGHT_THEMES).size).toBe(LIGHT_THEMES.length);
	});

	it("no theme appears in both dark and light", () => {
		const overlap = DARK_THEMES.filter((t) => (LIGHT_THEMES as readonly string[]).includes(t));
		expect(overlap).toEqual([]);
	});
});

describe("PI_TO_GHOSTTY", () => {
	it("covers every dark theme", () => {
		for (const name of DARK_THEMES) {
			expect(PI_TO_GHOSTTY[name]).toBeTruthy();
		}
	});

	it("covers every light theme", () => {
		for (const name of LIGHT_THEMES) {
			expect(PI_TO_GHOSTTY[name]).toBeTruthy();
		}
	});

	it("maps catppuccin-mocha to its Ghostty name", () => {
		expect(PI_TO_GHOSTTY["catppuccin-mocha"]).toBe("Catppuccin Mocha Sync");
	});

	it("maps everforest-light to its Ghostty name", () => {
		expect(PI_TO_GHOSTTY["everforest-light"]).toBe("Everforest Light");
	});
});

describe("rewriteGhosttyConfigPinned", () => {
	it("replaces a theme line with a single pinned theme", () => {
		const config = `font-size = 14\ntheme = light:Old Light,dark:Old Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfigPinned(config, "Catppuccin Mocha Sync");
		expect(result).toContain("theme = Catppuccin Mocha Sync");
		expect(result).not.toContain("light:");
		expect(result).not.toContain("dark:");
	});

	it("preserves surrounding config lines", () => {
		const config = `font-size = 14\ntheme = Everforest Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfigPinned(config, "High Contrast Dark");
		expect(result).toContain("font-size = 14");
		expect(result).toContain("window-theme = auto");
	});

	it("returns config unchanged when no theme line exists", () => {
		const config = `font-size = 14\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfigPinned(config, "Catppuccin Mocha Sync");
		expect(result).toBe(config);
	});
});

describe("rewriteGhosttyConfig", () => {
	it("replaces a simple theme line with light/dark syntax", () => {
		const config = `font-size = 14\ntheme = Catppuccin Mocha\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, THEME_PAIRS["everforest"]);
		expect(result).toContain("theme = light:Everforest Light,dark:Everforest Dark");
		expect(result).toContain("font-size = 14");
		expect(result).toContain("window-theme = auto");
	});

	it("replaces an existing light/dark theme line", () => {
		const config = `font-size = 14\ntheme = light:Old Light,dark:Old Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, THEME_PAIRS["high-contrast"]);
		expect(result).toContain("theme = light:High Contrast Light,dark:High Contrast Dark");
	});

	it("returns config unchanged when no theme line exists", () => {
		const config = `font-size = 14\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, THEME_PAIRS["catppuccin"]);
		expect(result).toBe(config);
	});
});
