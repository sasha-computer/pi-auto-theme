# pi-themes

Auto-switching dark/light themes for [pi](https://github.com/badlogic/pi-mono) + [Ghostty](https://ghostty.org), with matching palettes across both.

Three theme pairs, each with a dark and light variant:

| Pair | Dark | Light |
|------|------|-------|
| **Catppuccin** | Mocha | Latte |
| **Everforest** | Dark (medium contrast) | Light (medium contrast) |
| **High Contrast** | Pure black, saturated accents | Pure white, max contrast |

Pi and Ghostty use the same hex values, so your terminal background, ANSI colors, syntax highlighting, and pi's UI all match.

## Install

```bash
pi install git:github.com/sasha-computer/pi-themes
```

Or try it without installing:

```bash
pi -e git:github.com/sasha-computer/pi-themes
```

## Setup

Your Ghostty config (`~/.config/ghostty/config`) needs these two lines for auto dark/light switching:

```
theme = light:Catppuccin Latte Sync,dark:Catppuccin Mocha Sync
window-theme = auto
```

The extension installs the custom Ghostty theme files to `~/.config/ghostty/themes/` automatically on first run.

## Usage

Check what's active:

```
/theme-pair
```

> Theme pair: catppuccin (catppuccin-latte, light mode)

Switch pairs:

```
/theme-pair everforest
/theme-pair catppuccin
/theme-pair high-contrast
```

This updates both pi and Ghostty instantly. The system appearance (dark/light) is polled every 2 seconds, so flipping macOS appearance auto-switches both.

## How it works

- **Pi themes** (6 JSON files in `themes/`) define all 51 color tokens for pi's TUI
- **Ghostty themes** (embedded in the extension) use the same palette hex values for terminal colors
- **The extension** polls `osascript` for macOS dark mode, switches the pi theme, and on pair change rewrites the `theme = ...` line in Ghostty's config then triggers a reload via AppleScript

## Palettes

All colors sourced from the official repos:

- Catppuccin: [catppuccin/palette](https://github.com/catppuccin/palette) v1.7.1
- Everforest: [sainnhe/everforest](https://github.com/sainnhe/everforest) palette.md (medium contrast)
- High Contrast: custom, designed for maximum readability

## Requirements

- macOS (uses `osascript` for appearance detection and Ghostty reload)
- [Ghostty](https://ghostty.org) (optional, pi themes work standalone)
- [pi](https://github.com/badlogic/pi-mono)
