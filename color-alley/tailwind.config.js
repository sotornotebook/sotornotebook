/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#F2A93B',
        navy: '#1E2A5A',
        teal: '#2BB3A3',
        coral: '#F06C5B',
        dhallam: '#6E6A86',
        cream: '#FFF8EC',
        glow: '#FFE3A3',
      },
      fontFamily: {
        display: ['Lalezar', 'Tajawal', 'system-ui', 'sans-serif'],
        body: ['Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: { lantern: '0 0 24px rgba(242,169,59,.55)' },
    },
  },
  plugins: [],
};
