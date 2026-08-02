/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2a6ba7',
          'blue-dark': '#1e5a8f',
          'blue-deep': '#173f73',
          'blue-soft': '#eff6ff',
          green: '#33925d',
          'green-dark': '#246e48',
          'green-soft': '#eaf6ef',
          critical: '#b42318',
          'critical-soft': '#fef2f2',
        },
        teal: {
          50: '#eaf6ef',
          100: '#eaf6ef',
          200: '#eaf6ef',
          300: '#eaf6ef',
          400: '#33925d',
          500: '#33925d',
          600: '#33925d',
          700: '#246e48',
          800: '#246e48',
          900: '#246e48',
          950: '#246e48',
        },
      },
      fontFamily: {
        sans: ['var(--font-sf)'],
        display: ['var(--font-sf)'],
        body: ['var(--font-sf)'],
        heading: ['var(--font-sf)'],
        mono: ['var(--font-sf)'],
      },
    },
  },
  plugins: [],
};
