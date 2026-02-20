<p align="center">
  <img src="assets/hero.png" alt="pi-auto-theme" width="200" />
</p>

<h1 align="center">pi-auto-theme</h1>

<p align="center">
  Matched themes for pi, Ghostty, and tmux. Pick once, everything syncs.
</p>

<p align="center">
  <a href="#install">Install</a> ·
  <a href="#how-does-it-work">How does it work?</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#setup">Setup</a>
</p>

## Why pi-auto-theme?

Your terminal, multiplexer, and coding agent should look like they belong together. pi-auto-theme ships eight matched palettes where pi's TUI, Ghostty's terminal, and tmux use the exact same hex values.

Pick a theme with `/theme` and it sticks -- across reloads, restarts, everything.

## How does it work?

- **Eight themes** -- four Catppuccin flavours, Everforest dark/light, High Contrast dark/light
- **Ghostty sync** -- rewrites the Ghostty config and triggers a reload when you switch themes
- **tmux sync** -- writes `~/.config/tmux/theme.conf` and reloads tmux live
- **Reload-safe** -- theme is stored in `settings.json`, so `/reload` never causes a flash
- **Themes self-update** on every session start

| Dark | Light |
|------|-------|
| `catppuccin-mocha` | `catppuccin-latte` |
| `catppuccin-macchiato` | |
| `catppuccin-frappe` | |
| `everforest-dark` | `everforest-light` |
| `high-contrast-dark` | `high-contrast-light` |

## Install

```bash
pi install git:github.com/sasha-computer/pi-auto-theme
```

Or try it first:

```bash
pi -e git:github.com/sasha-computer/pi-auto-theme
```

## Setup

**Ghostty** -- your `~/.config/ghostty/config` needs a theme line:

```
theme = Catppuccin Mocha Sync
window-theme = auto
```

**tmux** -- your `~/.tmux.conf` needs to source the generated theme file:

```
source-file ~/.config/tmux/theme.conf
```

Both Ghostty and tmux theme files are installed automatically on first run. No manual palette setup.

If you don't use Ghostty or tmux, that's fine -- they're both optional.

## Usage

Open the interactive theme picker:

```
/theme
```

Arrow keys to navigate, Enter to confirm, Escape to cancel. Live preview as you browse.

Switch directly:

```
/theme catppuccin-mocha
/theme everforest-dark
/theme high-contrast-light
```

pi, Ghostty, and tmux all update instantly.

## Palettes

Colors sourced from official repos:

- **Catppuccin**: [catppuccin/palette](https://github.com/catppuccin/palette) v1.7.1
- **Everforest**: [sainnhe/everforest](https://github.com/sainnhe/everforest) medium contrast
- **High Contrast**: custom, max readability

## Requirements

- [pi](https://github.com/badlogic/pi-mono)
- [Ghostty](https://ghostty.org) (optional)
- [tmux](https://github.com/tmux/tmux) (optional)

## License

MIT
