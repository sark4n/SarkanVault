import type { ConsoleDefinition } from '../../shared/types'

export const consoleCatalog: ConsoleDefinition[] = [
  {
    id: 'nes',
    name: 'Nintendo Entertainment System',
    shortName: 'NES',
    manufacturer: 'Nintendo',
    generation: '8-bit',
    description: 'La consola que revivió los videojuegos: plataformas icónicas, shooters verticalesy el mayor catálogo de clásicos atemporales.',
    colorFrom: '#d32f2f',
    colorTo: '#ff6e40',
    accent: '#ffb74d',
    romExtensions: ['.nes', '.nez', '.bin', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: [
      {
        name: 'Nestopia',
        executableNames: ['Nestopia.exe', 'nestopia.exe'],
        installHints: ['Nestopia', 'Nestopia UE'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'FCEUX',
        executableNames: ['fceux.exe'],
        installHints: ['FCEUX'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Mesen',
        executableNames: ['Mesen.exe'],
        installHints: ['Mesen'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['nestopia_libretro.dll', 'fceumm_libretro.dll', 'mesen_libretro.dll']
      }
    ]
  },
  {
    id: 'sega-genesis',
    name: 'Sega Genesis',
    shortName: 'Genesis',
    manufacturer: 'Sega',
    generation: '16-bit',
    description: 'Plataformas arcade, shooters y clasicos deportivos con energia FM synth nítida.',
    colorFrom: '#1f6feb',
    colorTo: '#ff4f8b',
    accent: '#66d9ff',
    romExtensions: ['.gen', '.md', '.smd', '.bin', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
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
    description: 'RPGs coloridos, plataformas y clasicos multijugador con pixel art exuberante.',
    colorFrom: '#7c5cff',
    colorTo: '#5cf2c4',
    accent: '#c4b5fd',
    romExtensions: ['.smc', '.sfc', '.fig', '.swc', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
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
    description: 'Aventuras 3D, carreras y leyendas multijugador para cuatro controles.',
    colorFrom: '#1db954',
    colorTo: '#f7d65b',
    accent: '#8df06f',
    romExtensions: ['.z64', '.n64', '.v64', '.rom', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
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
    description: 'RPGs de la era del disco, carreras, peleas y experimentos cinematograficos.',
    colorFrom: '#7d8597',
    colorTo: '#ff8a4c',
    accent: '#ffd166',
    romExtensions: ['.bin', '.cue', '.iso', '.img', '.chd', '.pbp', '.m3u'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
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
    description: 'Aventuras de bolsillo con paletas brillantes y encanto de sesiones rapidas.',
    colorFrom: '#ff4f8b',
    colorTo: '#f7d65b',
    accent: '#ffb3cf',
    romExtensions: ['.gba', '.agb', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
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
    id: 'dreamcast',
    name: 'Sega Dreamcast',
    shortName: 'Dreamcast',
    manufacturer: 'Sega',
    generation: '128-bit',
    description: 'La última consola de Sega: acción 3D de culto, shooters intensos y joyas arcade únicas.',
    colorFrom: '#e05c2a',
    colorTo: '#ff9f4a',
    accent: '#ffcf86',
    romExtensions: ['.cdi', '.gdi', '.chd', '.cue', '.iso', '.zip'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: [
      {
        name: 'Flycast',
        executableNames: ['flycast.exe', 'flycast-win64.exe'],
        installHints: ['Flycast'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Redream',
        executableNames: ['redream.exe'],
        installHints: ['Redream'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['RetroArch'],
        defaultLaunchArguments: '-L "{core}" "{rom}"',
        retroArchCoreNames: ['flycast_libretro.dll']
      }
    ]
  },
  {
    id: 'gamecube',
    name: 'GameCube',
    shortName: 'GameCube',
    manufacturer: 'Nintendo',
    generation: '6th',
    description: 'La consola que trajo gráficos impresionantes y joyas como Super Smash Bros. Melee, The Legend of Zelda: The Wind Waker y Metroid Prime.',
    colorFrom: '#4a2c7d',
    colorTo: '#1e90ff',
    accent: '#00b7eb',
    romExtensions: ['.iso', '.gcm', '.ciso', '.gcz'],
    candidates: [
      {
        name: 'Dolphin',
        executableNames: ['Dolphin.exe'],
        installHints: [
          'C:\\Program Files\\Dolphin',
          'C:\\Emulators\\Dolphin',
          'C:\\Users\\Public\\Dolphin'
        ],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'RetroArch',
        executableNames: ['retroarch.exe'],
        installHints: ['C:\\RetroArch'],
        retroArchCoreNames: ['dolphin_libretro.dll']
      }
    ]
  },
  {
    id: 'switch',
    name: 'Nintendo Switch',
    shortName: 'Switch',
    manufacturer: 'Nintendo',
    generation: '8th Hybrid',
    description: 'La consola hibrida de Nintendo portatil.',
    colorFrom: '#e60012',
    colorTo: '#1a1a1a',
    accent: '#00d4aa',
    romExtensions: ['.nsp', '.xci', '.nsz', '.xcz'],
    imageUrl: 'https://images.pexels.com/photos/3719248/pexels-photo-3719248.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: [
      {
        name: 'Ryujinx',
        executableNames: ['Ryujinx.exe'],
        installHints: ['Ryujinx'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Yuzu',
        executableNames: ['yuzu.exe'],
        installHints: ['Yuzu'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Suyu',
        executableNames: ['suyu.exe'],
        installHints: ['Suyu'],
        defaultLaunchArguments: '"{rom}"'
      }
    ]
  },
  {
    id: 'pc',
    name: 'PC Gaming',
    shortName: 'PC',
    manufacturer: 'Windows',
    generation: 'Modern',
    description:
      'Juegos instalados en PC, accesos directos y bibliotecas de tiendas como Steam, Epic o GOG en una sola vista.',
    colorFrom: '#12b886',
    colorTo: '#3b82f6',
    accent: '#f59e0b',
    romExtensions: ['.exe', '.lnk', '.url', '.bat', '.cmd', '.acf'],
    imageUrl: 'https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=400',
    candidates: [
      {
        name: 'Lanzamiento directo',
        executableNames: [],
        installHints: [],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Steam',
        executableNames: ['steam.exe', 'Steam.exe'],
        installHints: ['Steam'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'GOG Galaxy',
        executableNames: ['GalaxyClient.exe'],
        installHints: ['GOG Galaxy', 'GOG Galaxy\\GalaxyClient'],
        defaultLaunchArguments: '"{rom}"'
      },
      {
        name: 'Epic Games Launcher',
        executableNames: ['EpicGamesLauncher.exe'],
        installHints: ['Epic Games\\Launcher\\Portal\\Binaries\\Win32'],
        defaultLaunchArguments: '"{rom}"'
      }
    ]
  }
]

export function getConsoleDefinition(consoleId: string): ConsoleDefinition | undefined {
  return consoleCatalog.find((consoleDef) => consoleDef.id === consoleId)
}
