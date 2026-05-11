import stylistic from '@stylistic/eslint-plugin'
import nextConfig from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactCompiler from 'eslint-plugin-react-compiler'

const eslintConfig = [
  {
    ignores: ['public/**', '.next/**', 'node_modules/**', '.claude/**'],
  },
  ...nextConfig,
  eslintConfigPrettier,
  {
    plugins: {
      'react-compiler': reactCompiler,
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/padding-line-between-statements': [
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
      'react/jsx-no-literals': [
        1,
        {
          allowedStrings: [':', '/', '(', ')', '•', '.', ',', '!', '#', '→'],
        },
      ],
    },
  },
]

export default eslintConfig
