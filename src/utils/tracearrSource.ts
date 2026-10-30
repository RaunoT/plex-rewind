import { MediaServer, ServerMembership, StatsSource } from '@/types/statsSource'
import { TautulliItemRow } from '@/types/tautulli'
import {
  getTracearrActivity,
  getTracearrFirstPlay,
  getTracearrHistoryReader,
  getTracearrKey,
  getTracearrLibraries,
  getTracearrLibrariesSize,
  getTracearrMedia,
  getTracearrPlays,
  getTracearrServerUsers,
  getTracearrUser,
  getTracearrUsers,
} from './fetchTracearr'
import { SourceMediaData } from './getMediaAdditionalData'
import getSettings from './getSettings'
import { fetchMediaServerId } from './mediaServer'
import {
  createPlayStats,
  EMPTY_ROW,
  filterPlays,
  LIBRARY_PLAY_TYPES,
  toSourceId,
} from './playStats'
import { getSnapshot, isString, saveSnapshot } from './sourceSnapshot'

// The saved ID stands in while the media server is down
async function getMediaServer(): Promise<MediaServer | null> {
  const { mediaServerType: type, mediaServerUrl: url } =
    getSettings().connection

  if (!url) {
    return null
  }

  const key = `${type}|${url}|serverId`
  const fetched = await fetchMediaServerId(type, url)

  if (fetched) {
    void saveSnapshot(key, fetched)
  }

  const serverId = fetched ?? (await getSnapshot(key, isString))

  return serverId ? { type, id: serverId, url } : null
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
    ...(await getTracearrMedia(item.media_id)),
  }
}

async function getTracearrInactiveUser(
  userId: string,
): Promise<TautulliItemRow> {
  const users = await getTracearrUsers()
  const user = users.find((user) => user.user_id === userId)

  return {
    ...EMPTY_ROW,
    user: user?.username ?? '',
    friendly_name: user?.friendly_name ?? '',
    user_thumb: user?.user_thumb ?? '',
    user_id: toSourceId(userId),
  }
}

// Tracearr's libraries each span every library of a media type
const playStats = createPlayStats({
  getPlays: async (since, libraries) =>
    filterPlays(await getTracearrPlays(since), {
      since,
      mediaTypes: libraries?.map(
        (library) => LIBRARY_PLAY_TYPES[library.section_type],
      ),
    }),
  getUsers: getTracearrServerUsers,
  getMediaData: getTracearrMediaData,
})
const tracearrSource: StatsSource = {
  ...playStats,
  getMediaServer,
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
