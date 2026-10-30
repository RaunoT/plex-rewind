import { MediaServerType } from '@/types/settings'
import { isGatewayError, isHostDown, markHostDown } from './hostBackoff'

const IDENTITY_TIMEOUT_MS = 10_000
// Both answer without a token. Plex's /identity has the machine identifier
// its links need, Jellyfin's public system info the ID its web app uses.
const IDENTITY_PATHS: Record<MediaServerType, string> = {
  plex: '/identity',
  jellyfin: '/System/Info/Public',
}

export function getIdentityPath(type: MediaServerType): string {
  return IDENTITY_PATHS[type]
}

export function readServerId(type: MediaServerType, data: unknown): string {
  const id =
    type === 'plex'
      ? (data as { MediaContainer?: { machineIdentifier?: unknown } })
          ?.MediaContainer?.machineIdentifier
      : (data as { Id?: unknown })?.Id

  return typeof id === 'string' ? id : ''
}

export async function fetchMediaServerId(
  type: MediaServerType,
  url: string,
): Promise<string | null> {
  const tag = `[${type.toUpperCase()}]`

  if (isHostDown(url)) {
    return null
  }

  let res: Response | undefined

  try {
    res = await fetch(`${url}${getIdentityPath(type)}`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 3600,
      },
      signal: AbortSignal.timeout(IDENTITY_TIMEOUT_MS),
    })

    if (!res.ok) {
      if (isGatewayError(res.status)) {
        markHostDown(url)
      }

      console.error(
        `${tag} - Couldn't get server ID from ${url}!`,
        res.status,
        res.statusText,
      )

      return null
    }

    return readServerId(type, await res.json()) || null
  } catch (error) {
    if (!res) {
      markHostDown(url)
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `${tag} - Getting server ID from ${url} timed out after ${IDENTITY_TIMEOUT_MS / 1000}s!`,
      )
    } else {
      console.error(`${tag} - Couldn't get server ID from ${url}!`, error)
    }

    return null
  }
}

// Jellyfin keeps IDs without dashes, but some clients write them with
export function normalizeJellyfinId(id: string): string {
  return id.replaceAll('-', '').toLowerCase()
}
