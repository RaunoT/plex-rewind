/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  jsxSingleQuote: true,
  semi: false,
  tabWidth: 2,
  useTabs: false,
  overrides: [
    {
      files: '*.svg',
      options: {
        parser: 'html',
      },
    },
  ],
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
}
