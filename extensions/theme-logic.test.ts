import { describe, it, expect } from "bun:test";
import { PAIR_NAMES, THEME_PAIRS, validatePairName, resolveTheme, rewriteGhosttyConfig } from "./theme-logic";

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
