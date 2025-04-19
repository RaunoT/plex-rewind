/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-tailwindcss'],
  rules: {
    'at-rule-no-deprecated': null,
    'selector-class-pattern': [
      '^[a-z]+(?:-[a-z]+)*(?:--[a-z]+(?:-[a-z]+)*)?$',
      {
        message: (selector) =>
          `Expected class selector ${selector} to be kebab-case, optionally followed by a --modifier`,
      },
    ],
  },
}
