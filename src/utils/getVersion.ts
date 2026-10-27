import { Version } from '@/types'
import { getRuntimeEnv } from './constants'

type GitHubRelease = {
  tag_name: string
  draft: boolean
  prerelease: boolean
}

const GITHUB_TIMEOUT_MS = 10_000
// Without internet access every page would wait for the timeout, so a failed
// check isn't retried for a while.
const GITHUB_RETRY_AFTER_MS = 15 * 60 * 1000

let lastFailedAt = 0

export function compareVersions(current: string, latest: string): boolean {
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
  const tag = getRuntimeEnv('NEXT_PUBLIC_VERSION_TAG') || ''
  const isSHA = /^[0-9a-f]{40}$/i.test(tag) // Check if tag is a 40-character SHA
  const currentVersion = tag ? (isSHA ? tag : `v${tag}`) : 'local' // Prefix with 'v' if not a SHA
  const isDevelop = currentVersion.includes('develop')
  const channel = tag ? (isDevelop || isSHA ? 'develop' : 'stable') : 'local'

  let latestVersion = currentVersion

  if (
    currentVersion !== 'local' &&
    !isSHA &&
    Date.now() - lastFailedAt > GITHUB_RETRY_AFTER_MS
  ) {
    try {
      const res = await fetch(
        'https://api.github.com/repos/RaunoT/plex-rewind/releases',
        {
          next: {
            revalidate: 600,
          },
          signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
        },
      )

      if (!res.ok) {
        lastFailedAt = Date.now()
        console.error(
          '[GITHUB] - API request failed',
          res.status,
          res.statusText,
        )
      } else {
        const data = await res.json()

        if (Array.isArray(data)) {
          const latestRelease = data.find(
            (release: GitHubRelease) =>
              typeof release?.tag_name === 'string' &&
              !release.draft &&
              (isDevelop ? release.prerelease : !release.prerelease),
          )

          if (latestRelease) {
            latestVersion = latestRelease.tag_name
          }
        }
      }
    } catch (error) {
      lastFailedAt = Date.now()

      if (error instanceof Error && error.name === 'TimeoutError') {
        console.error(
          `[GITHUB] - API request timed out after ${GITHUB_TIMEOUT_MS / 1000}s!`,
        )
      } else {
        console.error('[GITHUB] - Error fetching latest release!', error)
      }
    }
  }

  return {
    hasUpdate: compareVersions(currentVersion, latestVersion),
    latestVersion,
    currentVersion,
    channel,
  }
}
