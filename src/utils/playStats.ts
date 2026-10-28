import { Play, PlayMediaType } from '@/types/playHistory'
import {
  DurationQuery,
  MediaStats,
  PlaysByTime,
  StatsSource,
  TopItems,
  TopItemsQuery,
  TopMediaItems,
  TopUsersQuery,
} from '@/types/statsSource'
import {
  TautulliItemRow,
  TautulliLibrary,
  TautulliMediaType,
} from '@/types/tautulli'
import { countBy, groupBy, orderBy, sumBy, uniqBy } from 'lodash'
import getMediaAdditionalData, {
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'

export const PLAY_MEDIA_TYPES: PlayMediaType[] = ['movie', 'episode', 'track']

// The plays a library of each type has
export const LIBRARY_PLAY_TYPES: Record<TautulliMediaType, PlayMediaType> = {
  movie: 'movie',
  show: 'episode',
  artist: 'track',
}

export const EMPTY_ROW: TautulliItemRow = {
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

// A user the rankings can list
export type StatsUser = {
  identityId: string
  plexId: string
  username: string
  friendlyName: string
}

// What a statistics source gives the stats built from its plays
export type PlaysProvider = {
  // Every user's plays since `since` in the libraries, or in all of them
  getPlays: (
    since: string | Date,
    libraries?: TautulliLibrary[],
  ) => Promise<Play[]>
  // The users a ranking can list
  getUsers: () => Promise<StatsUser[]>
  getMediaData: (item: TautulliItemRow) => Promise<SourceMediaData>
}

export type PlayStats = Pick<
  StatsSource,
  | 'getTotalDuration'
  | 'getTopItems'
  | 'getTopUsers'
  | 'getMediaStats'
  | 'getTopMediaItems'
  | 'getPlaysByTime'
  | 'getPlayItem'
>

type PlaysQuery = Omit<DurationQuery, 'since'> & {
  since: string | Date
}

type PlayFilter = {
  since: string | Date
  mediaTypes?: PlayMediaType[]
  identityId?: string
  excludedIdentityIds?: string[]
}

// Narrows plays down to a window that starts at an exact time, and to the
// media types and users asked for.
export function filterPlays(
  plays: Play[],
  { since, mediaTypes, identityId, excludedIdentityIds = [] }: PlayFilter,
): Play[] {
  const sinceTime = new Date(since).getTime()

  return plays.filter(
    (play) =>
      play.startedAt >= sinceTime &&
      (!mediaTypes || mediaTypes.includes(play.mediaType)) &&
      (!identityId || play.identityId === identityId) &&
      !excludedIdentityIds.includes(play.identityId),
  )
}

export function getExcludedIdentityIds(
  users: StatsUser[],
  excludedPlexIds: string[],
): string[] {
  return users
    .filter((user) => excludedPlexIds.includes(user.plexId))
    .map((user) => user.identityId)
}

function getDuration(plays: Play[]): number {
  return Math.round(sumBy(plays, 'durationMs') / 1000)
}

function getMediaId(play: Play): string | null {
  switch (play.mediaType) {
    case 'movie':
      return play.mediaId
    case 'episode':
      return play.showMediaId
    default:
      return null
  }
}

function getRatingKey(play: Play): string | null {
  return play.mediaType === 'movie' ? play.ratingKey : play.grandparentRatingKey
}

function getTitleKey(play: Play): string {
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
// history has none, so plays group by the source's media id and otherwise by
// title, like Tautulli's top_movies, top_tv and top_music stats.
function groupPlays(plays: Play[]): Play[][] {
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
function toItemRow(plays: Play[]): TautulliItemRow {
  const newestFirst = orderBy(plays, 'startedAt', 'desc')
  const play =
    newestFirst.find((play) => getRatingKey(play) && play.thumb) ??
    newestFirst.find(getRatingKey) ??
    newestFirst[0]
  const isMovie = play.mediaType === 'movie'
  const titleByType: Record<PlayMediaType, string | null> = {
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

function rankItems(
  plays: Play[],
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

// The stats every source builds from its plays, so they count the same way
export function createPlayStats(provider: PlaysProvider): PlayStats {
  // Excluded users are left out, unless the query is for one of them
  async function getPlays({
    since,
    userId,
    libraries,
  }: PlaysQuery): Promise<Play[]> {
    const excludedUsers = getSettings().general.excludedUsers
    const [plays, users] = await Promise.all([
      provider.getPlays(since, libraries),
      userId || excludedUsers.length ? provider.getUsers() : [],
    ])
    const identityId = users.find((user) => user.plexId === userId)?.identityId

    if (userId && !identityId) {
      return []
    }

    return filterPlays(plays, {
      since,
      identityId,
      // A user's own stats still show when they're excluded from the server's.
      excludedIdentityIds: userId
        ? []
        : getExcludedIdentityIds(users, excludedUsers),
    })
  }

  async function addAdditionalData(
    items: TautulliItemRow[],
    mediaType: PlayMediaType,
  ): Promise<TautulliItemRow[]> {
    if (mediaType === 'track' || !items.length) {
      return items
    }

    return getMediaAdditionalData(
      items,
      mediaType === 'movie' ? 'movie' : 'tv',
      provider.getMediaData,
    )
  }

  async function getTopItems(
    library: TautulliLibrary,
    { period, userId, sortByPlays, count }: TopItemsQuery,
  ): Promise<TopItems> {
    const mediaType = LIBRARY_PLAY_TYPES[library.section_type]
    const plays = await getPlays({
      since: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
      userId,
      libraries: [library],
    })
    // The extra item only tells whether the ranking goes on.
    const topItems = rankItems(plays, count + 1, sortByPlays)
    const items = topItems.slice(0, count).map((item) => ({
      ...item,
      // Don't show how many users watched the item on personal dashboard
      users_watched: userId ? undefined : item.users_watched,
    }))

    return {
      items: await addAdditionalData(items, mediaType),
      hasMore: topItems.length > count,
    }
  }

  async function getTotalDuration(query: DurationQuery): Promise<number> {
    return getDuration(await getPlays(query))
  }

  async function getMediaStats(
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
  ): Promise<MediaStats> {
    const plays = await getPlays({ since, userId, libraries })
    const mediaTypes = libraries.map(
      (library) => LIBRARY_PLAY_TYPES[library.section_type],
    )

    function getStats(mediaType: PlayMediaType) {
      const typePlays = plays.filter((play) => play.mediaType === mediaType)

      return {
        count: typePlays.length,
        duration: mediaTypes.includes(mediaType)
          ? getDuration(typePlays)
          : null,
      }
    }

    return {
      shows: getStats('episode'),
      movies: getStats('movie'),
      audio: getStats('track'),
    }
  }

  async function getTopMediaItems(
    userId: string,
    libraries: TautulliLibrary[],
    since: string,
  ): Promise<TopMediaItems> {
    const plays = await getPlays({ since, userId, libraries })

    function getTop(mediaType: PlayMediaType) {
      const items = rankItems(
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
  async function getPlaysByTime(
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

  async function getTopUsers({
    since,
    libraries,
  }: TopUsersQuery): Promise<TautulliItemRow[]> {
    const [plays, users] = await Promise.all([
      getPlays({ since, libraries }),
      provider.getUsers(),
    ])
    const usersByIdentity = new Map(
      users.map((user) => [user.identityId, user]),
    )

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

  async function getPlayItem(play: Play): Promise<TautulliItemRow> {
    const [item] = await addAdditionalData([toItemRow([play])], play.mediaType)

    return item
  }

  return {
    getTotalDuration,
    getTopItems,
    getTopUsers,
    getMediaStats,
    getTopMediaItems,
    getPlaysByTime,
    getPlayItem,
  }
}
