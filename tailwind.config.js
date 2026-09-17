/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0b1220',
        'midnight-soft': '#121a2b',
        navy: '#162033',
        snow: '#f4f1ec',
        'snow-warm': '#ebe6de',
        frost: '#e8eef2',
        ink: '#141a24',
        'ink-muted': '#5b6577',
        aurora: {
          DEFAULT: '#1fa97a',
          deep: '#178a63',
          soft: '#b7f0d5',
        },
        ice: '#7eb6c9',
        amber: {
          sand: '#c4a574',
        },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
        // Legacy aliases used across older tour pages
        luxury: ['Cormorant Garamond', 'Georgia', 'serif'],
        elegant: ['Cormorant', 'Georgia', 'serif'],
        clean: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
        modern: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        rn: '72rem',
      },
      borderRadius: {
        rn: '14px',
        'rn-lg': '20px',
      },
      boxShadow: {
        rn: '0 18px 50px rgba(11, 18, 32, 0.12)',
        'rn-soft': '0 10px 30px rgba(11, 18, 32, 0.08)',
      },
    },
  },
  plugins: [],
};
