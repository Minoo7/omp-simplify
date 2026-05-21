# omp-simplify

OMP plugin that adds `/simplify` and `/simplify-settings` commands with optional auto-simplify follow-ups.

## Install

This plugin is an OMP npm-style extension. It works when installed as an npm package into OMP's plugin directory.

Once published to npm:

```bash
omp plugin install omp-simplify
```

Until then, install from a local checkout:

```bash
npm pack
npm install --prefix ~/.omp/plugins ./omp-simplify-0.1.0.tgz
```

Restart `omp` after installing so the extension is loaded.

## Usage

Inside OMP:

```text
/simplify
/simplify-settings
```
