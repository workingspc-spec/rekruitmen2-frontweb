/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sapphire:  '#0F52BA',
        navy:      '#000926',
        'ice-blue':'#D6E6F3',
        primary:   '#0F52BA',
        success:   '#2E7D32',
        warning:   '#F57C00',
        error:     '#D32F2F',
        info:      '#0F52BA',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(15,82,186,0.08)',
        'card-hover': '0 8px 24px rgba(15,82,186,0.16)',
      }
    },
  },
  plugins: [],
}