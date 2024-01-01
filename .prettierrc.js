/** @type {import("prettier").Config} */
/** https://prettier.io/docs/en/configuration.html */
module.exports = {
  singleQuote: false,
  jsxSingleQuote: true,
  semi: false,
  tabWidth: 2,
  useTabs: false,
  overrides: [
    {
      files: "*.svg",
      options: {
        parser: "html",
      },
    },
  ],
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
}
