/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'theme1-bg': '#F5F1E8',
        'theme1-sidebar': '#E8E0CF', 
        'theme1-primary': '#556B2F',
        'theme1-secondary': '#252C10',
        'theme1-tertiary': '#716EA7',
      },
    },
  },
  plugins: [],
}