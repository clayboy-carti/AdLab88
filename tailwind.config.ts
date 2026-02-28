import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F3ECDC',
        forest: '#1F3A32',
        rust: '#B55233',
        graphite: '#2A2A2A',
        outline: '#111111',
        sage: '#8FA99B',
      },
      fontFamily: {
        mono: ['IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '48': '48px',
      },
    },
  },
  plugins: [],
}

export default config
