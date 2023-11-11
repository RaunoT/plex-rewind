/** @type {import("prettier").Config} */
/** https://prettier.io/docs/en/configuration.html */
module.exports = {
  singleQuote: true,
  jsxSingleQuote: true,
  semi: false,
  tabWidth: 2,
  useTabs: false,
  plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
}
