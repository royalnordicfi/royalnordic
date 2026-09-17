/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        midnight: '#070b12',
        surface: {
          DEFAULT: '#0e1420',
          2: '#151c2b',
          elevated: '#1a2336',
        },
        text: {
          DEFAULT: '#f2f4f7',
          muted: '#9aa3b5',
          dim: '#6b7385',
        },
        aurora: {
          DEFAULT: '#10b981',
          hover: '#059669',
          soft: '#6ee7b7',
        },
        ice: '#7dd3fc',
        panel: {
          DEFAULT: '#f8fafc',
          ink: '#0f172a',
          muted: '#64748b',
        },
        // Back-compat aliases from Mission 1 / older pages
        snow: '#f2f4f7',
        'snow-warm': '#e8ecf1',
        frost: '#151c2b',
        ink: '#f2f4f7',
        'ink-muted': '#9aa3b5',
        navy: '#151c2b',
        'midnight-soft': '#0e1420',
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
        rn: '12px',
        'rn-lg': '14px',
      },
      boxShadow: {
        rn: '0 20px 50px rgba(0, 0, 0, 0.45)',
        'rn-soft': '0 10px 30px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
