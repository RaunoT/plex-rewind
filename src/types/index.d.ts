export type Version = {
  hasUpdate: boolean
  latestVersion: string
  currentVersion: string
  channel: 'develop' | 'stable' | 'local'
}
