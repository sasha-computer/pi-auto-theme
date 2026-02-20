# pi-auto-theme

A pi extension that syncs themes across pi, Ghostty, and tmux.

## Architecture

- `extensions/auto-theme.ts` -- the pi extension (entry point)
- `extensions/theme-logic.ts` -- pure functions and constants (testable, no side effects)
- `extensions/theme-logic.test.ts` -- bun tests for theme-logic
- `themes/*.json` -- pi theme definitions (JSON color tokens)
- `tmux-themes/*.conf` -- tmux theme configs (copied to `~/.config/tmux/themes/`)

## Key design decisions

**settings.json is the source of truth for the pi theme.** When the user picks a theme, the extension writes it to `~/.pi/agent/settings.json`. On `/reload`, pi reads settings.json and applies the theme itself -- the extension does NOT call `ctx.ui.setTheme()` in `session_start`. This prevents the reload flash bug where pi would overwrite the extension's theme.

**Ghostty and tmux sync uses diff-before-write.** On `session_start`, the extension reads the current Ghostty config and tmux theme file, generates what they should be, and only writes + reloads if they actually changed. This means `/reload` is a no-op for external tools (no AppleScript trigger, no tmux reload).

**No polling, no auto dark/light mode.** The extension used to poll macOS appearance every 2 seconds and auto-switch. This was removed because it added complexity (pairs, pinned vs auto, `currentAppliedTheme` debounce) and caused reload bugs. Now: pick a theme, it sticks.

## Testing

```bash
bun test
```

Tests cover theme-logic.ts only (pure functions). The extension itself is tested manually via `/reload` in pi.

## Adding a new theme

1. Add a pi theme JSON to `themes/`
2. Add a tmux theme conf to `tmux-themes/`
3. Add a Ghostty theme definition to the `GHOSTTY_THEMES` record in `auto-theme.ts`
4. Add the theme name to `ALL_THEMES`, `DARK_THEMES` or `LIGHT_THEMES`, and `PI_TO_GHOSTTY` in `theme-logic.ts`
5. Run `bun test` to verify coverage
