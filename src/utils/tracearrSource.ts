import {
  DurationQuery,
  MediaStats,
  PlaysByTime,
  ServerMembership,
  StatsSource,
  TopMediaItems,
  TopUsersQuery,
} from '@/types/statsSource'
import { TautulliItemRow, TautulliLibrary } from '@/types/tautulli'
import { countBy, groupBy, orderBy, sumBy, uniqBy } from 'lodash'
import {
  getTracearrActivity,
  getTracearrFirstPlay,
  getTracearrLibraries,
  getTracearrLibrariesSize,
  getTracearrPlays,
  getTracearrPlexUsers,
  getTracearrUser,
  getTracearrUsers,
  isTracearrMediaDeleted,
  TRACEARR_MEDIA_TYPES,
  TracearrPlay,
  TracearrPlayMediaType,
} from './fetchTracearr'
import getMediaAdditionalData, {
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'
import { filterPlays, getExcludedIdentityIds } from './tracearrPlays'

type PlaysQuery = Omit<DurationQuery, 'since'> & {
  since: string | Date
}

const PLEX_IDENTITY_TIMEOUT_MS = 10_000
const EMPTY_ROW: TautulliItemRow = {
  title: '',
  year: null,
  total_plays: 0,
  total_duration: 0,
  users_watched: undefined,
  rating_key: 0,
  thumb: '',
  is_deleted: false,
  rating: null,
  tmdb_id: null,
  imdb_id: null,
  user_thumb: '',
  user: '',
  friendly_name: '',
  requests: 0,
  audio_plays_count: 0,
  movies_plays_count: 0,
  shows_plays_count: 0,
  user_id: 0,
  rank: 0,
}

// Plex answers /identity without a token.
async function getServerId(): Promise<string> {
  const plexUrl = getSettings().connection.plexUrl

  try {
    const res = await fetch(`${plexUrl}/identity`, {
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 3600,
      },
      signal: AbortSignal.timeout(PLEX_IDENTITY_TIMEOUT_MS),
    })

    if (!res.ok) {
      console.error(
        `[PLEX] - Couldn't get server ID from ${plexUrl}!`,
        res.status,
        res.statusText,
      )

      return ''
    }

    const data = await res.json()

    return data?.MediaContainer?.machineIdentifier ?? ''
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.error(
        `[PLEX] - Getting server ID from ${plexUrl} timed out after ${PLEX_IDENTITY_TIMEOUT_MS / 1000}s!`,
      )
    } else {
      console.error(`[PLEX] - Couldn't get server ID from ${plexUrl}!`, error)
    }

    return ''
  }
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

async function getPlays({
  since,
  userId,
  libraries,
}: PlaysQuery): Promise<TracearrPlay[]> {
  const excludedUsers = getSettings().general.excludedUsers
  const [plays, users] = await Promise.all([
    getTracearrPlays(since),
    userId || excludedUsers.length ? getTracearrPlexUsers() : [],
  ])
  const identityId = users.find((user) => user.plexId === userId)?.identityId
  const mediaTypes = libraries?.map(
    (library) => TRACEARR_MEDIA_TYPES[library.section_type],
  )

  if (userId && !identityId) {
    return []
  }

  return filterPlays(plays, {
    since,
    mediaTypes,
    identityId,
    // A user's own stats still show when they're excluded from the server's.
    excludedIdentityIds: userId
      ? []
      : getExcludedIdentityIds(users, excludedUsers),
  })
}

function getDuration(plays: TracearrPlay[]): number {
  return Math.round(sumBy(plays, 'durationMs') / 1000)
}

function getMediaId(play: TracearrPlay): string | null {
  switch (play.mediaType) {
    case 'movie':
      return play.mediaId
    case 'episode':
      return play.showMediaId
    default:
      return null
  }
}

function getRatingKey(play: TracearrPlay): string | null {
  return play.mediaType === 'movie' ? play.ratingKey : play.grandparentRatingKey
}

function getTitleKey(play: TracearrPlay): string {
  switch (play.mediaType) {
    case 'episode':
      return (play.showTitle || play.title).trim().toLowerCase()
    case 'track':
      return (play.artistName || play.title).trim().toLowerCase()
    default:
      return `${play.title.trim().toLowerCase()}|${play.year ?? ''}`
  }
}

// Plex gives an item a new rating key when it's re-added, and imported
// history has none, so plays group by Tracearr's media id and otherwise by
// title, like Tautulli's top_movies, top_tv and top_music stats.
function groupPlays(plays: TracearrPlay[]): TracearrPlay[][] {
  const mediaIdsByTitle = new Map<string, string>()

  for (const play of plays) {
    const mediaId = getMediaId(play)
    const titleKey = getTitleKey(play)

    if (mediaId && !mediaIdsByTitle.has(titleKey)) {
      mediaIdsByTitle.set(titleKey, mediaId)
    }
  }

  return Object.values(
    groupBy(plays, (play) => {
      const titleKey = getTitleKey(play)

      return (
        getMediaId(play) ?? mediaIdsByTitle.get(titleKey) ?? `title:${titleKey}`
      )
    }),
  )
}

// Episodes roll up into their show and tracks into their artist. The newest
// play with a rating key and a poster points at the current library item.
// Without one, the rating key matters more than the poster, as it's what the
// Plex link needs, and the poster can come from any play.
function toItemRow(plays: TracearrPlay[]): TautulliItemRow {
  const newestFirst = orderBy(plays, 'startedAt', 'desc')
  const play =
    newestFirst.find((play) => getRatingKey(play) && play.thumb) ??
    newestFirst.find(getRatingKey) ??
    newestFirst[0]
  const isMovie = play.mediaType === 'movie'
  const titleByType: Record<TracearrPlayMediaType, string | null> = {
    movie: play.title,
    episode: play.showTitle,
    track: play.artistName,
  }
  const ratingKey = Number(getRatingKey(play)) || 0

  return {
    ...EMPTY_ROW,
    title: titleByType[play.mediaType] || play.title,
    year: isMovie ? play.year : null,
    total_plays: plays.length,
    total_duration: getDuration(plays),
    users_watched: uniqBy(plays, 'identityId').length,
    rating_key: ratingKey,
    grandparent_rating_key: ratingKey,
    thumb: play.thumb || newestFirst.find((play) => play.thumb)?.thumb || '',
    tmdb_id: isMovie ? play.tmdbId : null,
    imdb_id: isMovie ? play.imdbId : null,
    media_id: newestFirst.map(getMediaId).find(Boolean) ?? null,
  }
}

function getTopItems(
  plays: TracearrPlay[],
  count: number,
  sortByPlays = false,
): TautulliItemRow[] {
  return groupPlays(plays)
    .map(toItemRow)
    .sort((a, b) =>
      sortByPlays
        ? b.total_plays - a.total_plays || b.total_duration - a.total_duration
        : b.total_duration - a.total_duration,
    )
    .slice(0, count)
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

async function addAdditionalData(
  items: TautulliItemRow[],
  mediaType: TracearrPlayMediaType,
): Promise<TautulliItemRow[]> {
  if (mediaType === 'track' || !items.length) {
    return items
  }

  return getMediaAdditionalData(
    items,
    mediaType === 'movie' ? 'movie' : 'tv',
    getTracearrMediaData,
  )
}

async function getTracearrItems(
  library: TautulliLibrary,
  period: number,
  userId?: string,
  sortByPlays?: boolean,
): Promise<TautulliItemRow[]> {
  const mediaType = TRACEARR_MEDIA_TYPES[library.section_type]
  const plays = await getPlays({
    since: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
    userId,
    libraries: [library],
  })
  const items = getTopItems(plays, 5, sortByPlays).map((item) => ({
    ...item,
    // Don't show how many users watched the item on personal dashboard
    users_watched: userId ? undefined : item.users_watched,
  }))

  return addAdditionalData(items, mediaType)
}

async function getTracearrTotalDuration(query: DurationQuery): Promise<number> {
  return getDuration(await getPlays(query))
}

async function getTracearrTopMediaStats(
  userId: string,
  libraries: TautulliLibrary[],
  since: string,
): Promise<MediaStats> {
  const plays = await getPlays({ since, userId, libraries })
  const mediaTypes = libraries.map(
    (library) => TRACEARR_MEDIA_TYPES[library.section_type],
  )

  function getStats(mediaType: TracearrPlayMediaType) {
    const typePlays = plays.filter((play) => play.mediaType === mediaType)

    return {
      count: typePlays.length,
      duration: mediaTypes.includes(mediaType) ? getDuration(typePlays) : null,
    }
  }

  return {
    shows: getStats('episode'),
    movies: getStats('movie'),
    audio: getStats('track'),
  }
}

async function getTracearrTopMediaItems(
  userId: string,
  libraries: TautulliLibrary[],
  since: string,
): Promise<TopMediaItems> {
  const plays = await getPlays({ since, userId, libraries })

  function getTop(mediaType: TracearrPlayMediaType) {
    const items = getTopItems(
      plays.filter((play) => play.mediaType === mediaType),
      5,
    ).map((item) => ({ ...item, users_watched: undefined }))

    return addAdditionalData(items, mediaType)
  }

  const [shows, movies, audio] = await Promise.all([
    getTop('episode'),
    getTop('movie'),
    getTop('track'),
  ])

  return { shows, movies, audio }
}

// Hours and days are in the Plex Rewind server's timezone.
async function getTracearrPlaysByTime(
  userId: string,
  since: string,
): Promise<PlaysByTime> {
  const plays = await getPlays({ since, userId })
  const hourly = Array<number>(24).fill(0)
  const daily = Array<number>(7).fill(0)

  for (const play of plays) {
    const startedAt = new Date(play.startedAt)

    hourly[startedAt.getHours()]++
    daily[startedAt.getDay()]++
  }

  return { hourly, daily }
}

async function getTracearrUsersTop({
  since,
  libraries,
}: TopUsersQuery): Promise<TautulliItemRow[]> {
  const [plays, users] = await Promise.all([
    getPlays({ since, libraries }),
    getTracearrPlexUsers(),
  ])
  const usersByIdentity = new Map(users.map((user) => [user.identityId, user]))

  return Object.entries(groupBy(plays, 'identityId'))
    .flatMap(([identityId, userPlays]) => {
      const user = usersByIdentity.get(identityId)

      if (!user) {
        return []
      }

      const playsByType = countBy(userPlays, 'mediaType')

      return [
        {
          ...EMPTY_ROW,
          user: user.username,
          friendly_name: user.friendlyName,
          user_thumb: userPlays.find((play) => play.avatar)?.avatar ?? '',
          user_id: Number(user.plexId),
          total_plays: userPlays.length,
          total_duration: getDuration(userPlays),
          movies_plays_count: playsByType.movie ?? 0,
          shows_plays_count: playsByType.episode ?? 0,
          audio_plays_count: playsByType.track ?? 0,
        },
      ]
    })
    .sort((a, b) => b.total_duration - a.total_duration)
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

const tracearrSource: StatsSource = {
  getServerId,
  // Tracearr doesn't know which libraries are shared with a user.
  getLibraries: getTracearrLibraries,
  getLibrariesSize: getTracearrLibrariesSize,
  getUsers: getTracearrUsers,
  getServerUser,
  getActivity: getTracearrActivity,
  getTotalDuration: getTracearrTotalDuration,
  getTopItems: getTracearrItems,
  getTopUsers: getTracearrUsersTop,
  // The ranking already counts each user's plays.
  getPlaysCounts: async (users) => users,
  getInactiveUser: getTracearrInactiveUser,
  getMediaStats: getTracearrTopMediaStats,
  getTopMediaItems: getTracearrTopMediaItems,
  getPlaysByTime: getTracearrPlaysByTime,
  getFirstPlay: getTracearrFirstPlay,
}

export default tracearrSource
