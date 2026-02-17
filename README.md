<p align="center">
  <img src="assets/hero.png" alt="pi-ghostty-sync" width="200" />
</p>

<h1 align="center">pi-ghostty-sync</h1>

<p align="center">
  Matching dark/light themes for pi and Ghostty that follow your system appearance.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#how-does-it-work">How does it work?</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#setup">Setup</a>
</p>

## Why pi-ghostty-sync?

Your terminal and your coding agent should look like they belong together. And when you flip your Mac to dark mode at night, both should follow without you touching anything.

pi-ghostty-sync ships three matched palettes (Catppuccin, Everforest, High Contrast) where pi's TUI and Ghostty's terminal colors use the exact same hex values. The extension polls macOS appearance and switches automatically.

## How does it work?

<p align="center">
  <img src="demo.gif" alt="pi-ghostty-sync demo" width="800" />
</p>

- **Three theme pairs**, each with a dark and light variant
- **Auto dark/light switching** by polling macOS system appearance every 2 seconds
- **Ghostty sync** rewrites the Ghostty config and triggers a reload when you change pairs
- **Custom Ghostty themes** installed automatically on first run, matching pi's palette exactly

| Pair | Dark | Light |
|------|------|-------|
| Catppuccin | Mocha | Latte |
| Everforest | Dark (medium) | Light (medium) |
| High Contrast | Pure black | Pure white |

## Install

```bash
pi install git:github.com/sasha-computer/pi-ghostty-sync
```

Or try it first:

```bash
pi -e git:github.com/sasha-computer/pi-ghostty-sync
```

## Setup

For Ghostty sync, your `~/.config/ghostty/config` needs two lines:

```
theme = light:Catppuccin Latte Sync,dark:Catppuccin Mocha Sync
window-theme = auto
```

The extension drops matching Ghostty theme files into `~/.config/ghostty/themes/` on first run. No manual setup.

If you don't use Ghostty, that's fine. The pi themes work standalone.

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

Both pi and Ghostty update instantly. Flip macOS appearance and both follow within 2 seconds.

## Palettes

Colors sourced from official repos:

- **Catppuccin**: [catppuccin/palette](https://github.com/catppuccin/palette) v1.7.1
- **Everforest**: [sainnhe/everforest](https://github.com/sainnhe/everforest) medium contrast
- **High Contrast**: custom, max readability

## Requirements

- macOS (uses `osascript` for appearance detection)
- [pi](https://github.com/badlogic/pi-mono)
- [Ghostty](https://ghostty.org) (optional)

## License

MIT
