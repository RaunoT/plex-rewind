/** @type {import('tailwindcss').Config} */
/** https://tailwindcss.com/docs/configuration */
module.exports = {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      backgroundImage: {
        'gradient-card': 'linear-gradient(120deg, #0f766e, #4338ca, #6b21a8)',
      },
    },
  },
  plugins: [],
}
