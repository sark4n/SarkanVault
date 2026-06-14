import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        night: '#07080d',
        ink: '#101118',
        panel: '#171823',
        ember: '#ff8a4c',
        mint: '#5cf2c4',
        pulse: '#ff4f8b',
        volt: '#f7d65b'
      },
      boxShadow: {
        glow: '0 0 48px rgba(92, 242, 196, 0.18)',
        card: '0 22px 70px rgba(0, 0, 0, 0.45)'
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -8px, 0)' }
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        floaty: 'floaty 7s ease-in-out infinite',
        fadeUp: 'fadeUp 420ms ease-out both'
      }
    }
  },
  plugins: []
}

export default config
