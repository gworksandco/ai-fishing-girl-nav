/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 「海」をテーマにしたブランドカラー。ナミ（AI釣りガール）のアクセントカラーとしても使用。
        ocean: {
          50: '#eefbff',
          100: '#d7f4ff',
          200: '#b3eaff',
          300: '#7bdcff',
          400: '#3ac6ff',
          500: '#0aa9f2',
          600: '#0086cc',
          700: '#036aa3',
          800: '#075a86',
          900: '#0b4c70',
          950: '#062f47',
        },
        coral: {
          400: '#ff8f6b',
          500: '#ff6f47',
          600: '#f0532c',
        },
      },
      boxShadow: {
        card: '0 4px 20px -4px rgba(6, 47, 71, 0.15)',
      },
    },
  },
  plugins: [],
};
