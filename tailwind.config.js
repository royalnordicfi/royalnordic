/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#010403',
        midnight: '#030706',
        surface: {
          DEFAULT: '#08110e',
          2: '#0c1713',
          elevated: '#101c18',
        },
        elevated: '#101c18',
        text: {
          DEFAULT: '#f1f5f3',
          muted: '#95a39c',
          dim: '#66756e',
        },
        aurora: {
          DEFAULT: '#0f8f63',
          hover: '#0c7a54',
          soft: '#8dceb2',
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
        snow: '#f1f5f3',
        'snow-warm': '#e8ece9',
        frost: '#0c1713',
        ink: '#f1f5f3',
        'ink-muted': '#95a39c',
        navy: '#0c1713',
        'midnight-soft': '#08110e',
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
        rn: '10px',
        'rn-lg': '12px',
      },
      boxShadow: {
        rn: '0 24px 60px rgba(0, 0, 0, 0.5)',
        'rn-soft': '0 12px 32px rgba(0, 0, 0, 0.35)',
        'rn-glow': '0 0 32px rgba(15, 143, 99, 0.16)',
      },
    },
  },
  plugins: [],
};
