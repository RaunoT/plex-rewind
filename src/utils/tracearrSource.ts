import { ServerMembership, StatsSource } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import {
  getTracearrActivity,
  getTracearrFirstPlay,
  getTracearrHistoryReader,
  getTracearrKey,
  getTracearrLibraries,
  getTracearrLibrariesSize,
  getTracearrPlays,
  getTracearrPlexUsers,
  getTracearrUser,
  getTracearrUsers,
  isTracearrMediaDeleted,
} from './fetchTracearr'
import { SourceMediaData } from './getMediaAdditionalData'
import getSettings from './getSettings'
import { isGatewayError, isHostDown, markHostDown } from './hostBackoff'
import {
  createPlayStats,
  EMPTY_ROW,
  filterPlays,
  LIBRARY_PLAY_TYPES,
} from './playStats'
import { getSnapshot, isString, saveSnapshot } from './sourceSnapshot'

const PLEX_IDENTITY_TIMEOUT_MS = 10_000

// Plex answers /identity without a token.
async function fetchServerId(plexUrl: string): Promise<string | null> {
  const url = `${plexUrl}/identity`

  if (isHostDown(plexUrl)) {
    return null
  }

  let res: Response | undefined

  try {
    res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 3600,
      },
      signal: AbortSignal.timeout(PLEX_IDENTITY_TIMEOUT_MS),
    })

    if (!res.ok) {
      if (isGatewayError(res.status)) {
        markHostDown(plexUrl)
      }

      console.error(
        `[PLEX] - Couldn't get server ID from ${plexUrl}!`,
        res.status,
        res.statusText,
      )

      return null
    }

    const data = await res.json()

    return data?.MediaContainer?.machineIdentifier || null
  } catch (error) {
    if (!res) {
      markHostDown(plexUrl)
    }

    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[PLEX] - Getting server ID from ${plexUrl} timed out after ${PLEX_IDENTITY_TIMEOUT_MS / 1000}s!`,
      )
    } else {
      console.error(`[PLEX] - Couldn't get server ID from ${plexUrl}!`, error)
    }

    return null
  }
}

// The saved ID stands in while Plex is down
async function getServerId(): Promise<string> {
  const plexUrl = getSettings().connection.plexUrl
  const key = `plex|${plexUrl}|serverId`
  const serverId = await fetchServerId(plexUrl)

  if (!serverId) {
    return (await getSnapshot(key, isString)) ?? ''
  }

  void saveSnapshot(key, serverId)

  return serverId
}

async function getServerUser(userId: string): Promise<ServerMembership> {
  const user = await getTracearrUser(userId)

  if (user === null) {
    return { status: 'unavailable' }
  }

  return user
    ? { status: 'member', isAdmin: user.isAdmin }
    : { status: 'notMember' }
}

// Tracearr's plays already carry the poster.
export async function getTracearrMediaData(
  item: TautulliItemRow,
): Promise<SourceMediaData> {
  return {
    thumb: item.thumb,
    isDeleted: await isTracearrMediaDeleted(item.media_id),
  }
}

async function getTracearrInactiveUser(
  plexId: string,
): Promise<TautulliItemRow> {
  const users = await getTracearrUsers()
  const user = users.find((user) => user.user_id === plexId)

  return {
    ...EMPTY_ROW,
    user: user?.username ?? '',
    friendly_name: user?.friendly_name ?? '',
    user_thumb: user?.user_thumb ?? '',
    user_id: Number(plexId),
  }
}

// Tracearr's libraries each span every Plex library of a media type
const playStats = createPlayStats({
  getPlays: async (since, libraries) =>
    filterPlays(await getTracearrPlays(since), {
      since,
      mediaTypes: libraries?.map(
        (library) => LIBRARY_PLAY_TYPES[library.section_type],
      ),
    }),
  getUsers: getTracearrPlexUsers,
  getMediaData: getTracearrMediaData,
})
const tracearrSource: StatsSource = {
  ...playStats,
  getServerId,
  // Tracearr doesn't know which libraries are shared with a user.
  getLibraries: getTracearrLibraries,
  getLibrariesSize: getTracearrLibrariesSize,
  getUsers: getTracearrUsers,
  getServerUser,
  getActivity: getTracearrActivity,
  getInactiveUser: getTracearrInactiveUser,
  getFirstPlay: getTracearrFirstPlay,
  getHistoryReaders: async () => [getTracearrHistoryReader()],
  getSnapshotKey: getTracearrKey,
}

export default tracearrSource
