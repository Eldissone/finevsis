/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: { DEFAULT: '#efe7db', soft: '#f7f2ea', muted: '#ded2c0' },
        ink: { 950: '#15120e', 900: '#201b16', 800: '#3d362f', 700: '#60574d', 600: '#7f7468', 500: '#a29586' },
        sage: { DEFAULT: '#6f7858', soft: '#d6dac7' },
        caramel: { DEFAULT: '#c79f78', soft: '#ebdbc9' },
        sand: { DEFAULT: '#cbbca9', soft: '#ece2d4' },
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      boxShadow: {
        paper: '0 30px 80px rgba(49, 38, 24, 0.08)',
      },
    },
  },
  plugins: [],
};
