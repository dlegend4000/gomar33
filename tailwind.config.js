/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FDE047',
        'background-light': '#FFFFFF',
        'background-dark': '#1F1F1F',
        'surface-light': '#F3F4F6',
        'surface-dark': '#2D2D2D',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wave: 'wave 1.5s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { height: '10px' },
          '50%': { height: '24px' },
        },
      },
    },
  },
  plugins: [],
};
