import { Version } from '@/types'
import { env } from 'next-runtime-env'

type GitHubRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
}

export default async function getVersion(): Promise<Version> {
  const currentVersion = env('NEXT_PUBLIC_VERSION_TAG')
    ? `v${env('NEXT_PUBLIC_VERSION_TAG')}`
    : 'local'
  const isDevelop = currentVersion.includes('develop')
  let latestVersion = currentVersion

  if (currentVersion !== 'local') {
    try {
      const res = await fetch(
        'https://api.github.com/repos/RaunoT/plex-rewind/releases',
      )
      const data = await res.json()

      if (!res.ok) {
        console.error(
          `GitHub API request failed: ${res.status} ${res.statusText}`,
        )
      }

      const latestRelease = data.find(
        (release: GitHubRelease) =>
          !release.draft && (!isDevelop ? !release.prerelease : true),
      )

      latestVersion = latestRelease.tag_name
    } catch (error) {
      console.error('Error fetching latest version:', error)
    }
  }

  return {
    hasUpdate: latestVersion !== currentVersion,
    latestVersion,
    currentVersion,
  }
}
