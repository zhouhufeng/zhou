/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep navy + copper. Deliberately unlike the Harvard crimson of the
        // Lin Lab site — this is a personal page, not a lab page.
        ink: '#0f1720',
        'ink-2': '#18242f',
        'ink-3': '#243441',
        slate: '#4a5a6b',
        mute: '#77869a',
        rule: '#e3e0da',
        paper: '#fcfbf9',
        'paper-2': '#f5f2ec',
        copper: '#b4571f',
        'copper-2': '#d8834a',
        sand: '#f0e3d6',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: { shell: '74rem', prose: '46rem' },
    },
  },
  plugins: [],
}
