/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#edf8f8',
          100: '#d0eeee',
          200: '#a3dddd',
          300: '#6ec6c7',
          400: '#3faeb0',
          500: '#2d9496',
          600: '#257779',
          700: '#1e5f61',
          800: '#184a4c',
          900: '#123a3b',
        },
        navy: {
          900: '#050e1a',
          800: '#0a1930',
          700: '#0d2340',
        },
      },
      fontFamily: {
        // Main brand font — Cinzel Bold for all headings/titles
        serif: [
          'Cinzel',
          'Cinzel Decorative',
          'Playfair Display',
          'Georgia',
          'serif',
        ],
        // Body / UI text
        sans: [
          'Inter',
          'system-ui',
          'sans-serif',
        ],
        // Tagline / italic cursive (Monotype Corsiva is Windows system font)
        corsiva: [
          'Monotype Corsiva',
          'Brush Script MT',
          'Palatino Linotype',
          'cursive',
        ],
      },
      transitionDuration: { '400': '400ms' },
      letterSpacing: {
        brand: '0.12em',
        wide2: '0.25em',
        wider2: '0.35em',
      },
    },
  },
  plugins: [],
};
