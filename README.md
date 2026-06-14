# RetroForge

RetroForge is a fully local Windows desktop retro launcher built with Electron, React, Vite, TypeScript, and TailwindCSS.
It is designed like a cinematic frontend: console hubs, horizontal shelves, game details, favorites, recently played
games, local cover matching, and direct emulator launches.

## Features

- Electron desktop shell with context isolation, preload IPC, and no renderer Node access.
- React + TailwindCSS Netflix-style interface with dark mode, console hubs, hero panels, shelves, cards, and details.
- Local JSON database stored in Electron `userData`.
- Automatic emulator detection from `PATH` and common Windows install locations.
- Manual emulator, ROM folder, cover folder, extension, and launch argument configuration.
- ROM scanning for Sega Genesis, SNES, Nintendo 64, PlayStation 1, Game Boy Advance, and Nintendo DS.
- Local cover matching by ROM filename for `.jpg`, `.png`, and `.webp`.
- Optional online cover search through SteamGridDB and ScreenScraper.
- Direct launches with normal emulators or RetroArch-style `-L "{core}" "{rom}"` arguments.
- Sample shelves are shown until real ROM folders are configured.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

To create Windows installers/portable builds:

```bash
npm run dist:win
```

## Configure A Console

1. Open **Setup**.
2. Click **Detect emulators** or browse to an emulator `.exe`.
3. Choose a ROM folder.
4. Optionally choose a cover folder.
5. Confirm supported extensions and launch arguments.
6. Save the console and click **Scan library**.

Cover files are matched by normalized ROM filename. For example:

```text
D:\ROMs\SNES\Super Mario World.sfc
D:\ROMs\SNES\Covers\Super Mario World.png
```

## Online Cover Search

RetroForge stays offline by default. To enable online artwork:

1. Open **Setup**.
2. Enable **SteamGridDB** and paste your SteamGridDB API key, or enable **ScreenScraper** and fill in your account/developer credentials.
3. Save artwork settings.
4. Open a scanned game's details page and click **Find covers**.
5. Pick a result with **Use cover**.

Downloaded images are saved locally. If a console has a cover folder configured, RetroForge writes there; otherwise it
creates a `covers` folder beside the ROM.

For batch work, use **Missing for console** or **Missing for all** in Setup. The batch action downloads up to 30 missing
covers per run so providers are not hammered.

## Launch Argument Examples

Standalone emulator:

```text
"{rom}"
```

RetroArch:

```text
-L "{core}" "{rom}"
```

DuckStation:

```text
-batch "{rom}"
```

## Project Structure

```text
src/
  electron/
    main/
      consoleCatalog.ts       Console and emulator definitions
      emulatorDetector.ts     Windows emulator discovery
      launcher.ts             Process spawning for configured emulators
      localStore.ts           Lightweight local JSON persistence
      mediaProtocol.ts        Safe local cover image protocol
      romScanner.ts           ROM and cover scanning
      index.ts                Electron app and IPC registration
    preload/
      index.ts                Typed IPC bridge for the renderer
  renderer/
    src/
      components/             Reusable visual building blocks
      views/                  Home, console, details, and settings screens
      lib/                    UI helpers
      assets/                 Bundled UI assets
  shared/
    types.ts                  Shared frontend/backend types
```

## Future Extension Points

- Add consoles by extending `consoleCatalog.ts`.
- Add controller support from the renderer without changing the scanning backend.
- Swap JSON storage for SQLite behind the same `LocalStore` API.
- Add metadata scraping, achievements, themes, video previews, save states, or cloud sync as separate services.
