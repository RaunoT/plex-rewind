const config = {
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { breaking: true, release: 'major' },
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'ui', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'build', release: 'patch' },
          { type: 'ci', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'chore', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
        ],
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            {
              type: 'breaking',
              section: '❗ Breaking Changes',
              hidden: false,
            },
            { type: 'feat', section: '🚀 Features', hidden: false },
            { type: 'fix', section: '🐛 Bug fixes', hidden: false },
            { type: 'ui', section: '🎨 UI changes', hidden: false },
            {
              type: 'perf',
              section: '⚡ Performance improvements',
              hidden: false,
            },
            { type: 'build', section: '🚧 Build', hidden: false },
            { type: 'ci', section: '⚙️ CI', hidden: false },
            { type: 'revert', section: '⏪ Reverts', hidden: false },
            {
              type: 'refactor',
              section: '🔧 Refactor',
              hidden: false,
            },
            { type: 'docs', section: '📝 Documentation', hidden: false },
            { type: 'test', hidden: true },
            { type: 'chore', hidden: true },
            { type: 'style', hidden: true },
          ],
        },
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/exec',
      {
        verifyReleaseCmd:
          'echo NEXT_VERSION_TAG=${nextRelease.version} >> $GITHUB_ENV',
      },
    ],
    [
      '@saithodev/semantic-release-backmerge',
      {
        backmergeBranches: [{ from: 'main', to: 'develop' }],
        message: 'chore(release): backmerge [skip ci]',
      },
    ],
  ],
  branches: [
    'main',
    {
      name: 'develop',
      prerelease: 'develop',
    },
  ],
}

export default config
