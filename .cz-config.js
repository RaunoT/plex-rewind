module.exports = {
  types: [
    { value: 'feat', name: 'feat:     A new feature' },
    { value: 'fix', name: 'fix:      A bug fix' },
    { value: 'ui', name: 'ui:       Changes related to the UI' },
    {
      value: 'perf',
      name: 'perf:     A code change that improves performance',
    },
    { value: 'docs', name: 'docs:     Documentation only changes' },
    { value: 'revert', name: 'revert:   Revert a previous commit' },
    {
      value: 'chore',
      name: 'chore:    Changes to auxiliary tools such as libraries and dependencies',
    },
    {
      value: 'refactor',
      name: 'refactor: A code change that neither fixes a bug nor adds a feature',
    },
    {
      value: 'build',
      name: 'build:    Changes that affect the build system or external dependencies\n            (example scopes: docker, pnpm)',
    },
    {
      value: 'ci',
      name: 'ci:       Changes to our CI configuration files and scripts',
    },
    {
      value: 'style',
      name: 'style:    Changes that do not affect the meaning of the code\n            (white-space, formatting, missing semi-colons, etc)',
    },
    {
      value: 'test',
      name: 'test:     Adding missing tests or correcting existing tests',
    },
  ],
  scopes: [
    { name: 'rewind' },
    { name: 'dashboard' },
    { name: 'config' },
    { name: 'api' },
  ],
}
