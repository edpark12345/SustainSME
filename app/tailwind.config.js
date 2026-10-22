import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

// Resolve content globs relative to this config file (not the cwd) so the
// build works regardless of which directory the dev server is launched from.
const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [`${here}/index.html`, `${here}/src/**/*.{js,ts,jsx,tsx}`],
  theme: {
    extend: {
      colors: {
        // Accenture purple palette
        accenture: {
          DEFAULT: '#A100FF',
          50: '#F6ECFF',
          100: '#EBD6FF',
          200: '#D9B3FF',
          300: '#C285FF',
          400: '#AE4DFF',
          500: '#A100FF',
          600: '#8400D6',
          700: '#6A00AB',
          800: '#500080',
          900: '#3A005C',
        },
        ink: {
          DEFAULT: '#1A1A24',
          soft: '#4A4A57',
          muted: '#7A7A88',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F5F4F7',
          border: '#E6E4EC',
        },
        // semantic accents reused across charts/levers
        positive: '#1FA971',
        warning: '#E6A700',
        danger: '#D64545',
      },
      fontFamily: {
        sans: ['Graphik', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,26,36,0.06), 0 8px 24px rgba(26,26,36,0.06)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
};
