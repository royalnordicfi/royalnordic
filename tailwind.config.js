/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#020504',
        midnight: '#050807',
        surface: {
          DEFAULT: '#0a100e',
          2: '#101816',
          elevated: '#141e1b',
        },
        elevated: '#141e1b',
        text: {
          DEFAULT: '#f4f7f5',
          muted: 'rgba(244, 247, 245, 0.62)',
          dim: 'rgba(244, 247, 245, 0.42)',
        },
        aurora: {
          DEFAULT: '#7dcead',
          hover: '#95d9bd',
          soft: '#7dcead',
        },
        sale: {
          DEFAULT: '#c45c4a',
          soft: '#e8a99a',
          muted: 'rgba(196, 92, 74, 0.12)',
        },
        ice: '#7dd3fc',
        panel: {
          DEFAULT: '#f7f8f6',
          ink: '#0c1410',
          muted: '#5c6b64',
        },
        snow: '#f4f7f5',
        'snow-warm': '#e8ece9',
        frost: '#101816',
        ink: '#f4f7f5',
        'ink-muted': 'rgba(244, 247, 245, 0.62)',
        navy: '#101816',
        'midnight-soft': '#0a100e',
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
        rn: 'var(--rn-container)',
        'rn-wide': 'var(--rn-container-wide)',
        'rn-product': 'var(--rn-container-product)',
        'rn-narrow': 'var(--rn-container-narrow)',
        'rn-booking': 'var(--rn-booking-max)',
        'rn-measure': 'var(--rn-measure-lede)',
      },
      borderRadius: {
        rn: '14px',
        'rn-lg': '20px',
      },
      boxShadow: {
        rn: '0 24px 60px rgba(0, 0, 0, 0.45)',
        'rn-soft': '0 12px 32px rgba(0, 0, 0, 0.28)',
        'rn-glow': '0 0 32px rgba(125, 206, 173, 0.18)',
      },
    },
  },
  plugins: [],
}
