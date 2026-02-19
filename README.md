<p align="center">
  <img src="assets/hero.png" alt="pi-auto-theme" width="200" />
</p>

<h1 align="center">pi-auto-theme</h1>

<p align="center">
  Auto-switching themes for pi, Ghostty, and tmux that follow your system appearance.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#how-does-it-work">How does it work?</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#setup">Setup</a>
</p>

## Why pi-auto-theme?

Your terminal, multiplexer, and coding agent should look like they belong together. And when you flip your Mac to dark mode at night, all three should follow without you touching anything.

pi-auto-theme ships five matched palettes (four Catppuccin flavours + Everforest + High Contrast) where pi's TUI, Ghostty's terminal, and tmux use the exact same hex values. The extension polls macOS appearance and switches everything automatically.

## How does it work?

- **Five theme pairs**, each with a dark and light variant
- **Auto dark/light switching** by polling macOS system appearance every 2 seconds
- **Ghostty sync** rewrites the Ghostty config and triggers a reload when you change pairs
- **tmux sync** writes `~/.config/tmux/theme.conf` and reloads the tmux server live
- **Themes self-update** on every session start — no manual reinstall needed after updates

| Pair | Dark | Light |
|------|------|-------|
| `catppuccin` | Mocha | Latte |
| `catppuccin-macchiato` | Macchiato | Latte |
| `catppuccin-frappe` | Frappe | Latte |
| `everforest` | Dark (medium) | Light (medium) |
| `high-contrast` | Pure black | Pure white |

## Install

```bash
pi install git:github.com/sasha-computer/pi-auto-theme
```

Or try it first:

```bash
pi -e git:github.com/sasha-computer/pi-auto-theme
```

## Setup

**Ghostty** — your `~/.config/ghostty/config` needs two lines:

```
theme = light:Catppuccin Latte Sync,dark:Catppuccin Mocha Sync
window-theme = auto
```

**tmux** — your `~/.tmux.conf` needs to source the generated theme file:

```
source-file ~/.config/tmux/theme.conf
```

Both Ghostty and tmux theme files are installed automatically on first run. No manual palette setup.

If you don't use Ghostty or tmux, that's fine — they're both optional.

## Usage

Open the interactive theme picker:

```
/theme
```

Arrow keys to navigate, Enter to confirm, Escape to cancel. **Live preview** -- pi, Ghostty, and tmux all update as you browse.

Switch directly:

```
/theme catppuccin
/theme catppuccin-macchiato
/theme catppuccin-frappe
/theme everforest
/theme high-contrast
```

pi, Ghostty, and tmux all update instantly. Flip macOS appearance and all three follow within 2 seconds.

## Palettes

Colors sourced from official repos:

- **Catppuccin**: [catppuccin/palette](https://github.com/catppuccin/palette) v1.7.1
- **Everforest**: [sainnhe/everforest](https://github.com/sainnhe/everforest) medium contrast
- **High Contrast**: custom, max readability

## Requirements

- macOS (uses `osascript` for appearance detection)
- [pi](https://github.com/badlogic/pi-mono)
- [Ghostty](https://ghostty.org) (optional)
- [tmux](https://github.com/tmux/tmux) (optional)

## License

MIT
