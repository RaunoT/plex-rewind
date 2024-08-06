import { Version } from '@/types'
import { env } from 'next-runtime-env'

type GitHubRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
}

export default async function getVersion(): Promise<Version> {
  const tag = env('NEXT_PUBLIC_VERSION_TAG') || ''
  const isSHA = /^[0-9a-f]{40}$/i.test(tag) // Check if tag is a 40-character SHA
  const currentVersion = tag ? (isSHA ? tag : `v${tag}`) : 'local' // Prefix with 'v' if not a SHA
  const isDevelop = currentVersion.includes('develop')
  let latestVersion = currentVersion

  if (currentVersion !== 'local' && !isSHA) {
    try {
      const res = await fetch(
        'https://api.github.com/repos/RaunoT/plex-rewind/releases',
        {
          next: {
            revalidate: 600,
          },
        },
      )
      const data = await res.json()

      if (!res.ok) {
        console.error(
          '[GITHUB] - API request failed',
          res.status,
          res.statusText,
        )
      }

      if (data) {
        const latestRelease = data.find(
          (release: GitHubRelease) =>
            !release.draft &&
            (isDevelop ? release.prerelease : !release.prerelease),
        )

        if (latestRelease) {
          latestVersion = latestRelease.tag_name
        }
      }
    } catch (error) {
      console.error('[GITHUB] - Error fetching latest release!', error)
    }
  }

  return {
    hasUpdate: latestVersion !== currentVersion,
    latestVersion,
    currentVersion,
  }
}
