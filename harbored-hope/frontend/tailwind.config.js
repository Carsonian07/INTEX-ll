/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'hh-navy':       '#1B3A6B',
        'hh-navy-dark':  '#122850',
        'hh-navy-light': '#EEF3FA',
        'hh-ocean':      '#2E86C1',
        'hh-ocean-light':'#D6EAF8',
        'hh-gold':       '#D4A017',
        'hh-gold-light': '#FDF3DC',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
