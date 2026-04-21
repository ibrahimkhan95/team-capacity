/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Named design tokens
        'brand-orange':   '#E3492B',
        'brand-green':    '#1B998B',
        'brand-navy':     '#0D3764',
        'eggshell':       '#F5F0E3',
        'light-gray':     '#F4F4F4',
        'baby-purple':    '#DBCDF0',
        'baby-cyan':      '#97ECF1',
        'light-salmon':   '#F8A978',
        'powder-blue':    '#BADFDB',
        'baby-blue-eyes': '#B2D0FD',
        'baby-pink':      '#F5CAC3',
        'hot-pink':       '#FF5E98',
        'yellow':         '#FCCC5D',
        // Shorthands kept for existing code
        no:  '#E3492B',
        nb:  '#0D3764',
        ng:  '#1B998B',
        np:  '#BADFDB',
        nbb: '#B2D0FD',
        bg:  '#F5F0E3',
        sur: '#FFFFFF',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono:  ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        sh:     '4px 4px 0px #0D3764',
        sh2:    '6px 6px 0px #0D3764',
        sh3:    '8px 8px 0px #0D3764',
        salmon: '6px 6px 0px #F8A978',
      },
    },
  },
  plugins: [],
}
