import { describe, it, expect } from "bun:test";
import {
	ALL_THEMES,
	DARK_THEMES,
	LIGHT_THEMES,
	PI_TO_GHOSTTY,
	isValidTheme,
	rewriteGhosttyConfig,
} from "./theme-logic";

describe("ALL_THEMES", () => {
	it("contains all eight themes", () => {
		expect(ALL_THEMES).toHaveLength(8);
	});

	it("contains no duplicates", () => {
		expect(new Set(ALL_THEMES).size).toBe(ALL_THEMES.length);
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
		const overlap = DARK_THEMES.filter((t) => LIGHT_THEMES.includes(t));
		expect(overlap).toEqual([]);
	});

	it("dark + light covers all themes", () => {
		const combined = [...DARK_THEMES, ...LIGHT_THEMES].sort();
		const all = [...ALL_THEMES].sort();
		expect(combined).toEqual(all);
	});
});

describe("isValidTheme", () => {
	it("returns true for valid theme names", () => {
		expect(isValidTheme("catppuccin-mocha")).toBe(true);
		expect(isValidTheme("everforest-light")).toBe(true);
		expect(isValidTheme("high-contrast-dark")).toBe(true);
	});

	it("returns false for invalid names", () => {
		expect(isValidTheme("nonexistent")).toBe(false);
		expect(isValidTheme("catppuccin")).toBe(false);
		expect(isValidTheme("")).toBe(false);
	});
});

describe("PI_TO_GHOSTTY", () => {
	it("covers every theme", () => {
		for (const name of ALL_THEMES) {
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

describe("rewriteGhosttyConfig", () => {
	it("replaces a theme line with the new theme", () => {
		const config = `font-size = 14\ntheme = Catppuccin Mocha\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, "Everforest Dark");
		expect(result).toContain("theme = Everforest Dark");
		expect(result).toContain("font-size = 14");
		expect(result).toContain("window-theme = auto");
	});

	it("replaces a light/dark theme line", () => {
		const config = `font-size = 14\ntheme = light:Old Light,dark:Old Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, "High Contrast Dark");
		expect(result).toContain("theme = High Contrast Dark");
		expect(result).not.toContain("light:");
	});

	it("preserves surrounding config lines", () => {
		const config = `font-size = 14\ntheme = Everforest Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, "High Contrast Light");
		expect(result).toContain("font-size = 14");
		expect(result).toContain("window-theme = auto");
	});

	it("returns config unchanged when no theme line exists", () => {
		const config = `font-size = 14\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, "Catppuccin Mocha Sync");
		expect(result).toBe(config);
	});

	it("returns config unchanged when theme already matches", () => {
		const config = `font-size = 14\ntheme = Everforest Dark\nwindow-theme = auto\n`;
		const result = rewriteGhosttyConfig(config, "Everforest Dark");
		expect(result).toBe(config);
	});
});
