import type { ConsoleDefinition } from '../../shared/types'

export const consoleCatalog: ConsoleDefinition[] = [
  {
    id: 'sega-genesis',
    name: 'Sega Genesis',
    shortName: 'Genesis',
    manufacturer: 'Sega',
    generation: '16-bit',
    description: 'Arcade-speed platformers, shooters, and sports classics with sharp FM synth energy.',
    colorFrom: '#1f6feb',
    colorTo: '#ff4f8b',
    accent: '#66d9ff',
    romExtensions: ['.gen', '.md', '.smd', '.bin', '.zip'],
    candidates: [
      {
        name: 'Kega Fusion',
        executableNames: ['fusion.exe', 'Fusion.exe'],
        installHints: ['Kega Fusion', 'Fusion'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'BlastEm',
        executableNames: ['blastem.exe'],
        installHints: ['BlastEm'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['genesis_plus_gx_libretro.dll', 'picodrive_libretro.dll']
      }
    ]
  },
  {
    id: 'snes',
    name: 'Super Nintendo',
    shortName: 'SNES',
    manufacturer: 'Nintendo',
    generation: '16-bit',
    description: 'Colorful RPGs, platformers, and couch classics with lush pixel art.',
    colorFrom: '#7c5cff',
    colorTo: '#5cf2c4',
    accent: '#c4b5fd',
    romExtensions: ['.smc', '.sfc', '.fig', '.swc', '.zip'],
    candidates: [
      {
        name: 'Snes9x',
        executableNames: ['snes9x-x64.exe', 'snes9x.exe'],
        installHints: ['Snes9x'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'bsnes',
        executableNames: ['bsnes.exe'],
        installHints: ['bsnes', 'higan'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['snes9x_libretro.dll', 'bsnes_libretro.dll', 'mesen-s_libretro.dll']
      }
    ]
  },
  {
    id: 'n64',
    name: 'Nintendo 64',
    shortName: 'N64',
    manufacturer: 'Nintendo',
    generation: '64-bit',
    description: 'Big-room 3D adventures, racers, and four-controller party legends.',
    colorFrom: '#1db954',
    colorTo: '#f7d65b',
    accent: '#8df06f',
    romExtensions: ['.z64', '.n64', '.v64', '.rom', '.zip'],
    candidates: [
      {
        name: 'Project64',
        executableNames: ['Project64.exe', 'Project64k.exe'],
        installHints: ['Project64'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Mupen64Plus',
        executableNames: ['mupen64plus-ui-console.exe', 'mupen64plus.exe'],
        installHints: ['Mupen64Plus'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['mupen64plus_next_libretro.dll', 'parallel_n64_libretro.dll']
      }
    ]
  },
  {
    id: 'ps1',
    name: 'PlayStation 1',
    shortName: 'PS1',
    manufacturer: 'Sony',
    generation: '32-bit',
    description: 'Disc-era RPGs, racers, fighters, and cinematic experiments.',
    colorFrom: '#7d8597',
    colorTo: '#ff8a4c',
    accent: '#ffd166',
    romExtensions: ['.bin', '.cue', '.iso', '.img', '.chd', '.pbp', '.m3u'],
    candidates: [
      {
        name: 'DuckStation',
        executableNames: ['duckstation-qt-x64-ReleaseLTCG.exe', 'duckstation-qt-x64.exe', 'duckstation-qt.exe'],
        installHints: ['DuckStation'],
        defaultLaunchArguments: '-batch "{rom}"'
      },
      {
        name: 'ePSXe',
        executableNames: ['ePSXe.exe', 'epsxe.exe'],
        installHints: ['ePSXe'],
        defaultLaunchArguments: '-nogui -loadbin "{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['swanstation_libretro.dll', 'pcsx_rearmed_libretro.dll', 'mednafen_psx_hw_libretro.dll']
      }
    ]
  },
  {
    id: 'gba',
    name: 'Game Boy Advance',
    shortName: 'GBA',
    manufacturer: 'Nintendo',
    generation: 'Handheld',
    description: 'Pocket-sized adventures with bright palettes and quick-session charm.',
    colorFrom: '#ff4f8b',
    colorTo: '#f7d65b',
    accent: '#ffb3cf',
    romExtensions: ['.gba', '.agb', '.zip'],
    candidates: [
      {
        name: 'mGBA',
        executableNames: ['mGBA.exe', 'mgba.exe'],
        installHints: ['mGBA'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'VisualBoyAdvance-M',
        executableNames: ['visualboyadvance-m.exe', 'vbam.exe'],
        installHints: ['VisualBoyAdvance-M', 'VBA-M'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['mgba_libretro.dll', 'vba_next_libretro.dll']
      }
    ]
  },
  {
    id: 'nds',
    name: 'Nintendo DS',
    shortName: 'NDS',
    manufacturer: 'Nintendo',
    generation: 'Dual-screen',
    description: 'Stylus-era RPGs, puzzle experiments, and portable curiosities.',
    colorFrom: '#5cf2c4',
    colorTo: '#8aa0ff',
    accent: '#99f6e4',
    romExtensions: ['.nds', '.dsi', '.zip'],
    candidates: [
      {
        name: 'melonDS',
        executableNames: ['melonDS.exe', 'melonds.exe'],
        installHints: ['melonDS'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'DeSmuME',
        executableNames: ['DeSmuME.exe', 'desmume.exe', 'DeSmuME_0.9.13_x64.exe'],
        installHints: ['DeSmuME'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['melonds_libretro.dll', 'desmume_libretro.dll']
      }
    ]
  }
]

export function getConsoleDefinition(consoleId: string): ConsoleDefinition | undefined {
  return consoleCatalog.find((consoleDef) => consoleDef.id === consoleId)
}
