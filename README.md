# omp-simplify

OMP plugin that adds `/simplify` and `/simplify-settings` commands with optional auto-simplify follow-ups.

## Install from GitHub marketplace

This repository is an OMP marketplace. Add the marketplace first, then install the plugin from it:

```bash
omp plugin marketplace add https://github.com/Minoo7/omp-simplify
omp plugin install simplify@omp-simplify
```

Restart `omp` after installing so the extension is loaded.

## Install locally while developing

```bash
omp plugin marketplace add /tmp/omp-simplify-plugin
omp plugin install simplify@omp-simplify
```

## Usage

Inside OMP:

```text
/simplify
/simplify-settings
```
