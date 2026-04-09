# Old Dota 7.30

A Dota 2 custom game project aiming to recreate gameplay and mechanics from patch 7.30.

This repository is a hobby project that serves both as a playable experience and a technical reference. It includes a variety of gameplay systems, structured code examples, and fully custom abilities implemented from scratch.

The project includes:

- [TypeScript for Panorama](https://moddota.com/panorama/introduction-to-panorama-ui-with-typescript)
- [TypeScript for VScripts](https://typescripttolua.github.io/)
- [Continuous Integration](#continuous-integration) support
- Simple commands to build and launch your custom game
- Localization system — a simple and scalable approach to managing translations

## Getting Started

1. Clone this repository or, if you're planning to have a repository for your custom game on GitHub, [create a new repository from this template](https://help.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template) and clone it instead.
2. Install dependencies:
```bash
npm install
```
(Optional) Keep dependencies up to date:
```bash
npm update
```
3. Start development:
- Press `Ctrl+Shift+B` in VSCode
- or run:
```bash
npm run dev
```

## Contents:

### Source Code

* **[src/common]:** TypeScript `.d.ts` type declaration files with types that can be shared between Panorama and VScripts
* **[src/vscripts]:** TypeScript code for Dota addon (Lua) vscripts. Compiles lua to `game/scripts/vscripts`.
* **[src/panorama]:** TypeScript code for panorama UI. Compiles js to `content/panorama/scripts/custom_game`
* **[src/localization]**: A convenient localization workflow that merges multiple `.txt` files into a single `addon_english.txt`

### Game & Content

* **[game/*]:** Dota game directory containing files such as npc kv files and compiled lua scripts.
* **[content/*]:** Dota content directory containing panorama sources other than scripts (xml, css, compiled js)

### Tooling

* **[scripts/*]:** Repository installation scripts

## Continuous Integration

This template includes a [GitHub Actions](https://github.com/features/actions) [workflow](.github/workflows/ci.yml) that builds your custom game on every commit and fails when there are type errors.
