const config = {
  '**/*.{js,jsx,ts,tsx}': [
    'prettier --write --cache',
    'eslint --cache --fix',
    // A function entry runs the command once, without the staged file list.
    () => 'tsc --noEmit',
  ],
  '**/*.css': ['stylelint --cache --fix', 'prettier --write --cache'],
  '**/*.{md,json}': 'prettier --write --cache',
}

export default config
