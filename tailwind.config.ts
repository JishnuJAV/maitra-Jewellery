import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand slate-blue (primary) — from the Maitra logo
        denim: {
          50: '#f3f5f8',
          100: '#e5e9f0',
          200: '#cbd3e0',
          300: '#a6b2c8',
          400: '#7c8aa6',
          500: '#64708f',
          600: '#515c78',
          700: '#434b62',
          800: '#394053',
          900: '#2f3547',
        },
        // Cool light neutral (backgrounds, borders)
        mist: {
          50: '#f7f9fb',
          100: '#eef2f7',
          200: '#dfe6ee',
          300: '#c6d2de',
          400: '#a7b7c8',
          500: '#8a9db2',
          600: '#6f8398',
          700: '#5b6f84',
          800: '#4b5d6f',
          900: '#3d4d5c',
        },
        // Cyan accent — from the logo
        sky: {
          100: '#d9f2fa',
          200: '#b0e6f5',
          300: '#7ed6ee',
          400: '#3cc0e2',
          500: '#1fa8cc',
          600: '#1789a8',
        },
        // Yellow accent — from the logo
        sun: {
          100: '#fdf6d3',
          200: '#faec9f',
          300: '#f6e06a',
          400: '#f2d94a',
          500: '#e6c62f',
          600: '#c9a91f',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        script: ['var(--font-script)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
