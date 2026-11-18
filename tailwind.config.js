/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      /*
       * Colour tokens. Contrast ratios (WCAG 2.1) were checked for every
       * text/background pairing used in the UI:
       *   ink-900 on white 17.5:1 · ink-600 on white 7.8:1 · ink-500 on white 5.5:1
       *   ink-900 on gold-400 8.3:1 (primary buttons) · gold-700 on white 5.6:1
       *   gold-300 on ink-900 10.6:1 · ink-400 borders on white 3.6:1 (non-text, >= 3:1)
       * Don't put body text in ink-400 or lighter on white, or white text on gold.
       */
      colors: {
        ink: {
          50: '#F7F5F2',
          100: '#EFECE7',
          200: '#E2DDD5',
          300: '#B9B2A8',
          400: '#8C857D',
          500: '#6F6860',
          600: '#57514A',
          700: '#3F3A34',
          800: '#2A2621',
          900: '#1C1915',
        },
        gold: {
          50: '#FBF6E9',
          100: '#F5EACB',
          200: '#EDD9A0',
          300: '#E3C77A',
          400: '#D2AE4E',
          500: '#C09A30',
          600: '#A07E1C',
          700: '#81640F',
          800: '#634C0C',
          900: '#45350A',
        },
        sand: {
          50: '#FAF7F2',
          100: '#F3EEE6',
          200: '#E9E1D3',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: ['var(--font-display)', 'Georgia', 'Cambria', 'serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 21, 0.06), 0 1px 3px rgba(28, 25, 21, 0.08)',
        lift: '0 10px 30px -12px rgba(28, 25, 21, 0.25)',
        popover: '0 20px 50px -12px rgba(28, 25, 21, 0.35)',
      },
      maxWidth: {
        prose: '68ch',
      },
      keyframes: {
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
        'dialog-in': 'dialog-in 200ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
      },
    },
  },
  plugins: [],
};
