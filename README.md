# omp-simplify

OMP plugin that adds `/simplify` and `/simplify-settings` commands with optional auto-simplify follow-ups.

## Install

Current OMP releases load ExtensionAPI plugins from npm-style package installs in OMP's plugin directory.

Install directly from GitHub:

```bash
bun install --cwd ~/.omp/plugins github:Minoo7/omp-simplify
```

Or, after publishing to npm:

```bash
omp plugin install omp-simplify
```

For local development:

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
