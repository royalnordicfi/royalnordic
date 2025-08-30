/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'luxury': ['Cormorant Garamond', 'serif'],
        'modern': ['Inter', 'sans-serif'],
        'elegant': ['Cormorant', 'serif'],
        'clean': ['Inter', 'sans-serif'],
        'termes': ['TeX Gyre Termes', 'serif'],
      },
    },
  },
  plugins: [],
};
