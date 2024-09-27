/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import plugin from 'tailwindcss/plugin'

/** https://tailwindcss.com/docs/configuration */
export const content = [
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
]
export const theme = {
  container: {
    center: true,
    padding: '1rem',
  },
}
export const plugins = [
  forms,
  plugin(({ matchUtilities, theme }) => {
    matchUtilities(
      {
        'animation-delay': (value) => {
          return {
            'animation-delay': value,
          }
        },
      },
      {
        values: theme('transitionDelay'),
      },
    )
  }),
]
