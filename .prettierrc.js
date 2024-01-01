/** @type {import("prettier").Config} */
/** https://prettier.io/docs/en/configuration.html */
module.exports = {
	singleQuote: true,
	jsxSingleQuote: true,
	semi: true,
	tabWidth: 2,
	useTabs: true,
	overrides: [
		{
			files: '*.svg',
			options: {
				parser: 'html',
			},
		},
	],
	plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
};
