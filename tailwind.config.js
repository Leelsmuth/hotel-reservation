/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#9B7143',
        // foreground: 'var(--foreground)',
        primary: '#725527',
        alternate: '#B28B17',
      },
    },
  },
  plugins: [],
};
