/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        no:  '#E3492B',
        nb:  '#0D3764',
        ng:  '#1B998B',
        np:  '#BADFDB',
        nbb: '#B2D0FD',
        bg:  '#F5F7FA',
        sur: '#FFFFFF',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        mono:  ['"Roboto Mono"', 'monospace'],
      },
      boxShadow: {
        sh:  '0 1px 3px rgba(13,55,100,0.08)',
        sh2: '0 4px 12px rgba(13,55,100,0.12)',
        sh3: '0 8px 32px rgba(13,55,100,0.20)',
      },
    },
  },
  plugins: [],
}
