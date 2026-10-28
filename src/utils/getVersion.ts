import { Version } from '@/types'

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

function parseVersion(version: string): number[] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-develop\.(\d+))?$/.exec(version)

  if (!match) return null

  const [, major, minor, patch, develop] = match

  // A release comes after all of its develop builds
  return [major, minor, patch, develop ?? Infinity].map(Number)
}

export function compareVersions(current: string, latest: string): boolean {
  const currentParts = parseVersion(current)
  const latestParts = parseVersion(latest)

  // Fallback to string comparison if parsing fails
  if (!currentParts || !latestParts) {
    return latest !== current
  }

  const index = latestParts.findIndex((part, i) => part !== currentParts[i])

  return index !== -1 && latestParts[index] > currentParts[index]
}

export default async function getVersion(): Promise<Version> {
  // Read statically so Next.js inlines the build's tag. A container can carry
  // an older image's value in its env, which must not change the version.
  const tag = process.env.NEXT_PUBLIC_VERSION_TAG || ''
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
          // GitHub doesn't list releases in version order (develop.9 comes
          // before develop.18), so take the highest one.
          const latestRelease = data
            .filter(
              (release: GitHubRelease) =>
                typeof release?.tag_name === 'string' &&
                !release.draft &&
                (isDevelop ? release.prerelease : !release.prerelease),
            )
            .reduce<GitHubRelease | undefined>(
              (latest, release) =>
                !latest || compareVersions(latest.tag_name, release.tag_name)
                  ? release
                  : latest,
              undefined,
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
