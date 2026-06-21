/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mood: {
          red: '#E85D4C',
          blue: '#5B7FD4',
          yellow: '#F2C94C',
          green: '#6BBF8A',
        },
        still: {
          bg: '#0f1419',
          surface: '#1a222d',
          border: '#2a3544',
          accent: '#7eb8a8',
          warm: '#e8a87c',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
