module.exports = {
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
        'style',
        'ci',
        'test',
      ],
    ],
  },
}
