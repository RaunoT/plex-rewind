import type { UserConfig } from '@commitlint/types'

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'ui',
        'perf',
        'docs',
        'revert',
        'chore',
        'refactor',
        'build',
        'ci',
        'style',
        'test',
      ],
    ],
  },
}

export default config
