export default {
  '**/*.{js,jsx,ts,tsx}': [
    'prettier --write --cache',
    'eslint --cache --fix',
    'bash -c tsc --noEmit --skipLibCheck',
  ],
  '**/*.css': 'stylelint --cache --fix',
  '**/*.{css,md,json}': 'prettier --write --cache',
}
