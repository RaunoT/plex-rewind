import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: {},
})
const eslintConfig = [
  ...compat.config({
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'next/core-web-vitals',
      'prettier',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', '@stylistic/js', 'react-compiler'],
    rules: {
      '@stylistic/js/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'return', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: 'if', next: '*' },
        { blankLine: 'always', prev: '*', next: 'if' },
        { blankLine: 'always', prev: ['const', 'let'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['const', 'let'] },
        { blankLine: 'never', prev: 'const', next: 'const' },
        { blankLine: 'never', prev: 'let', next: 'let' },
      ],
      'react-compiler/react-compiler': 2,
      'react/jsx-no-literals': 1,
    },
  }),
]

export default eslintConfig
