import { Version } from '@/types'
import { env } from 'next-runtime-env'

type GitHubRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
}

function compareVersions(current: string, latest: string): boolean {
  if (!current.includes('develop') || !latest.includes('develop')) {
    return latest !== current
  }

  const parseVersion = (version: string) => {
    // Remove 'v' prefix if present
    const cleanVersion = version.startsWith('v') ? version.slice(1) : version
    // Split on '-develop.' to get base version and develop number
    const parts = cleanVersion.split('-develop.')

    if (parts.length !== 2) return null

    const [baseVersion, developNum] = parts
    const baseParts = baseVersion.split('.').map(Number)
    const developNumber = parseInt(developNum, 10)

    return {
      major: baseParts[0] || 0,
      minor: baseParts[1] || 0,
      patch: baseParts[2] || 0,
      develop: developNumber,
    }
  }
  const currentParsed = parseVersion(current)
  const latestParsed = parseVersion(latest)

  // Fallback to string comparison if parsing fails
  if (!currentParsed || !latestParsed) {
    return latest !== current
  }

  // Compare base version first
  if (latestParsed.major !== currentParsed.major) {
    return latestParsed.major > currentParsed.major
  }

  if (latestParsed.minor !== currentParsed.minor) {
    return latestParsed.minor > currentParsed.minor
  }

  if (latestParsed.patch !== currentParsed.patch) {
    return latestParsed.patch > currentParsed.patch
  }

  // Compare develop number
  return latestParsed.develop > currentParsed.develop
}

export default async function getVersion(): Promise<Version> {
  const tag = env('NEXT_PUBLIC_VERSION_TAG') || ''
  const isSHA = /^[0-9a-f]{40}$/i.test(tag) // Check if tag is a 40-character SHA
  const currentVersion = tag ? (isSHA ? tag : `v${tag}`) : 'local' // Prefix with 'v' if not a SHA
  const isDevelop = currentVersion.includes('develop')
  const channel = tag ? (isDevelop || isSHA ? 'develop' : 'stable') : 'local'

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
    hasUpdate: compareVersions(currentVersion, latestVersion),
    latestVersion,
    currentVersion,
    channel,
  }
}
