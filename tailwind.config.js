/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#020506',
        midnight: '#050a10',
        surface: {
          DEFAULT: '#0b121a',
          2: '#111a24',
          elevated: '#16202c',
        },
        text: {
          DEFAULT: '#f2f5f7',
          muted: '#9aa7b5',
          dim: '#6d7a8a',
        },
        aurora: {
          DEFAULT: '#12b981',
          hover: '#0d9f6e',
          soft: '#7decc0',
        },
        ice: '#7dd3fc',
        panel: {
          DEFAULT: '#f4f7f9',
          ink: '#0c141c',
          muted: '#5b6b7c',
        },
        snow: '#f2f5f7',
        'snow-warm': '#e8ecf1',
        frost: '#111a24',
        ink: '#f2f5f7',
        'ink-muted': '#9aa7b5',
        navy: '#111a24',
        'midnight-soft': '#0b121a',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        luxury: ['Cormorant Garamond', 'Georgia', 'serif'],
        elegant: ['Cormorant', 'Georgia', 'serif'],
        clean: ['Inter', 'system-ui', 'sans-serif'],
        modern: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        rn: '72rem',
      },
      borderRadius: {
        rn: '10px',
        'rn-lg': '12px',
      },
      boxShadow: {
        rn: '0 24px 60px rgba(0, 0, 0, 0.5)',
        'rn-soft': '0 12px 32px rgba(0, 0, 0, 0.35)',
        'rn-glow': '0 0 32px rgba(18, 185, 129, 0.18)',
      },
    },
  },
  plugins: [],
};
