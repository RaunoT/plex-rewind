import { authOptions } from '@/lib/auth'
import { Settings } from '@/types/settings'
import {
  DurationQuery,
  MediaStats,
  PlaysByTime,
  StatsSource,
  TopMediaItems,
  TopUsersQuery,
  UserPlaysCounts,
} from '@/types/statsSource'
import {
  TautulliActivity,
  TautulliGraph,
  TautulliItem,
  TautulliItemRow,
  TautulliLibrary,
  TautulliMediaReturnType,
  TautulliMediaType,
  TautulliUser,
} from '@/types/tautulli'
import { sum } from 'lodash'
import { getServerSession } from 'next-auth'
import { cache } from 'react'
import fetchTautulli from './fetchTautulli'
import { timeToSeconds } from './formatting'
import getMediaAdditionalData, {
  mapWatchedDataByRatingKey,
  SourceMediaData,
} from './getMediaAdditionalData'
import getSettings from './getSettings'
import { getTautulliTotalDuration } from './getTautulliDuration'
import { daysBetween } from './helpers'
import { LibrariesSize, sumLibrariesSize } from './librariesSize'

const statIdMap: Record<TautulliMediaType, string> = {
  movie: 'top_movies',
  show: 'top_tv',
  artist: 'top_music',
}
const popularIdMap: Record<TautulliMediaType, string> = {
  movie: 'popular_movies',
  show: 'popular_tv',
  artist: 'popular_music',
}
const historyMediaTypeMap: Record<TautulliMediaType, string> = {
  movie: 'movie',
  show: 'episode',
  artist: 'track',
}
const typeToResultMap: Record<TautulliMediaType, TautulliMediaReturnType> = {
  show: 'shows',
  movie: 'movies',
  artist: 'audio',
}
// Maps Tautulli's English day-of-week labels to a fixed index (0 = Sunday) so
// the peak day is resolved from the actual label rather than its array
// position, which shifts with Tautulli's `week_start_monday` setting.
const DAY_NAME_TO_INDEX: Record<string, number | undefined> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}
const EMPTY_USER_ROW: TautulliItemRow = {
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
// The timeout signal opts requests out of fetch's per-render deduplication, so
// lookups repeated by a page's layout, metadata and content share one call.
const fetchLibraries = cache(() =>
  fetchTautulli<TautulliLibrary[]>('get_libraries'),
)
const fetchUsers = cache(() => fetchTautulli<TautulliUser[]>('get_users'))
const fetchUser = cache((userId: string) =>
  fetchTautulli<TautulliUser>('get_user', { user_id: userId }),
)

async function getServerId(): Promise<string> {
  const settings = getSettings()

  let plexUrl: URL

  try {
    plexUrl = new URL(settings.connection.plexUrl)
  } catch {
    console.error('[PLEX] - The Plex URL is not configured correctly!')

    return ''
  }

  const plexHost = plexUrl.hostname
  const plexPort = plexUrl.port
  const serverIdPromise = await fetchTautulli<{ identifier: string }>(
    'get_server_id',
    {
      hostname: plexHost,
      port: plexPort,
    },
    true,
  )
  const serverId = serverIdPromise?.response?.data?.identifier

  if (serverId) {
    return serverId
  } else {
    console.error(
      `[TAUTULLI] - Couldn't find server ID for Plex server with hostname ${plexUrl} and port ${plexPort}`,
    )

    return ''
  }
}

async function getLibraries(): Promise<TautulliLibrary[]> {
  const libraries = (await fetchLibraries())?.response?.data

  if (!Array.isArray(libraries)) {
    console.warn('[TAUTULLI] - No libraries found!')

    return []
  }

  return filterBySharedLibraries(getSettings(), libraries)
}

async function filterBySharedLibraries(
  settings: Settings,
  libraries: TautulliLibrary[],
): Promise<TautulliLibrary[]> {
  if (settings.general.isOutsideAccess || !settings.setupComplete) {
    return libraries
  }

  const session = await getServerSession(authOptions)
  const userId = session?.user.id

  if (!userId) {
    console.error('[TAUTULLI] - No user ID found!')

    return []
  }

  const userDataResponse = await fetchUser(userId)

  if (!userDataResponse) {
    console.warn(`[TAUTULLI] - Could not fetch user data for user ID ${userId}`)

    return []
  }

  return libraries.filter((library) =>
    userDataResponse.response.data?.shared_libraries?.includes(
      library.section_id,
    ),
  )
}

async function getLibrariesSize(
  libraries: TautulliLibrary[],
): Promise<LibrariesSize> {
  const res = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<{ total_file_size?: number }>(
        'get_library_media_info',
        {
          section_id: library.section_id,
          length: 0,
        },
        true,
      ),
    ),
  )

  // Tautulli only reports a size for TV and music libraries once "Calculate
  // Total File Sizes" is enabled.
  return sumLibrariesSize(
    libraries.map((library, i) => ({
      size: res[i]?.response?.data?.total_file_size,
      hasItems: Number(library.count) > 0 || Number(library.child_count) > 0,
    })),
  )
}

async function getUsers(): Promise<TautulliUser[]> {
  const usersRes = await fetchUsers()
  const users = usersRes?.response?.data

  if (!Array.isArray(users)) {
    return []
  }

  return users.filter((user) => user.is_active && user.username !== 'Local')
}

async function getServerUser(
  userId: string,
  email: string,
): Promise<{ isAdmin: boolean } | null> {
  const userRes = await fetchUser(userId)
  const user = userRes?.response?.data

  if (user?.email !== email || !user?.is_active) {
    return null
  }

  return { isAdmin: user.is_admin === 1 }
}

async function getActivity(): Promise<TautulliActivity | null> {
  const res = await fetchTautulli<TautulliActivity>('get_activity')

  return res?.response?.data ?? null
}

async function getTotalDuration({
  since,
  userId,
  libraries,
}: DurationQuery): Promise<number> {
  const excludedUsers = getSettings().general.excludedUsers

  if (!libraries) {
    return getTautulliTotalDuration({ after: since, userId, excludedUsers })
  }

  const durations = await Promise.all(
    libraries.map((library) =>
      getTautulliTotalDuration({
        after: since,
        sectionId: library.section_id,
        userId,
        excludedUsers,
      }),
    ),
  )

  return sum(durations)
}

export async function getTautulliMediaData(
  item: TautulliItemRow,
): Promise<SourceMediaData> {
  const res = await fetchTautulli<TautulliItemRow>(
    'get_metadata',
    { rating_key: item.rating_key },
    true,
  )
  const metadata = res?.response?.data

  return {
    thumb: metadata?.thumb || '',
    isDeleted: metadata ? Object.keys(metadata).length === 0 : false,
  }
}

async function getTopItems(
  library: TautulliLibrary,
  period: number,
  userId?: string,
  sortByPlays?: boolean,
): Promise<TautulliItemRow[]> {
  const sectionType = library.section_type
  const itemsRes = await fetchTautulli<TautulliItem>('get_home_stats', {
    stat_id: statIdMap[sectionType],
    stats_count: 5,
    stats_type: sortByPlays ? 'plays' : 'duration',
    time_range: period,
    section_id: library.section_id,
    user_id: userId ? userId : '',
  })

  let items = []

  items = itemsRes?.response?.data?.rows || []

  if (items.length) {
    const usersWatched = await fetchTautulli<TautulliItem>('get_home_stats', {
      stat_id: popularIdMap[sectionType],
      stats_count: 100, // TODO: https://github.com/Tautulli/Tautulli/issues/2103
      time_range: period,
    })
    const usersWatchedData = usersWatched?.response?.data?.rows

    if (usersWatchedData) {
      // Get artists users listened data
      if (sectionType === 'artist') {
        items.map((artist) => {
          const usersListenedMapped = mapWatchedDataByRatingKey(
            usersWatchedData,
            artist,
          )

          artist.users_watched = usersListenedMapped
        })
      }

      // Get tv/movies additional data
      if (sectionType === 'show' || sectionType === 'movie') {
        items = await getMediaAdditionalData(
          items,
          sectionType === 'movie' ? 'movie' : 'tv',
          getTautulliMediaData,
          usersWatchedData,
        )
      }

      // Don't show how many users watched the item on personal dashboard
      if (userId) {
        items = items.map((item) => {
          delete item.users_watched

          return item
        })
      }
    }
  }

  return items
}

async function getTopUsers({
  period,
  libraries,
}: TopUsersQuery): Promise<TautulliItemRow[] | null> {
  const excludedUsers = getSettings().general.excludedUsers
  const activeUsers = (await getUsers()).filter(
    (user) => !excludedUsers.includes(String(user.user_id)),
  )

  if (!activeUsers.length) {
    console.error('Could not determine the number of users!')

    return null
  }

  // get_home_stats only reliably accepts a `time_range` in days (last N days
  // from today), so callers pass the window length as `period`. The per-user
  // history counts in getPlaysCounts use `since` directly, also anchored to now.
  const time_range = period || 30
  // get_home_stats can't exclude users itself, so it still ranks excluded
  // users. Request enough rows that they can't push the users we want to keep
  // out of the window before we filter them out below.
  const statsCount = activeUsers.length + excludedUsers.length
  const userStats = await Promise.all(
    libraries.map((library) =>
      fetchTautulli<TautulliItem>('get_home_stats', {
        stat_id: 'top_users',
        stats_count: statsCount,
        stats_type: 'duration',
        section_id: library.section_id,
        time_range,
      }),
    ),
  )
  const combinedUserStats: { [userId: string]: TautulliItemRow } = {}

  userStats.forEach((stat) => {
    const users = stat?.response?.data?.rows

    if (users) {
      users.forEach((user) => {
        if (excludedUsers.includes(String(user.user_id))) {
          return
        }

        if (combinedUserStats[user.user_id]) {
          combinedUserStats[user.user_id].total_duration += user.total_duration
        } else {
          combinedUserStats[user.user_id] = { ...user }
        }
      })
    }
  })

  return Object.values(combinedUserStats).sort(
    (a, b) => b.total_duration - a.total_duration,
  )
}

async function getPlaysCounts(
  users: TautulliItemRow[],
  since: string,
  libraries: TautulliLibrary[],
): Promise<UserPlaysCounts[]> {
  const librariesOfType = (type: TautulliMediaType) =>
    libraries.filter((library) => library.section_type === type)
  const moviesLib = librariesOfType('movie')
  const showsLib = librariesOfType('show')
  const audioLib = librariesOfType('artist')

  // Only the match count is needed, so no history rows are requested.
  async function countPlays(userId: number, libraries: TautulliLibrary[]) {
    const counts = await Promise.all(
      libraries.map(async (library) => {
        const history = await fetchTautulli<{ recordsFiltered: number }>(
          'get_history',
          {
            user_id: userId,
            after: since,
            section_id: library.section_id,
            length: 0,
          },
        )

        return history?.response?.data?.recordsFiltered || 0
      }),
    )

    return sum(counts)
  }

  return Promise.all(
    users.map(async (user) => {
      const [movies, shows, audio] = await Promise.all([
        countPlays(user.user_id, moviesLib),
        countPlays(user.user_id, showsLib),
        countPlays(user.user_id, audioLib),
      ])

      return {
        movies_plays_count: movies,
        shows_plays_count: shows,
        audio_plays_count: audio,
      }
    }),
  )
}

async function getInactiveUser(id: string): Promise<TautulliItemRow | null> {
  const user = (await fetchUser(id))?.response?.data

  // Without a user ID the play counts would be for the whole server.
  if (user?.user_id == null) {
    return null
  }

  // Only what a ranking row shows. The row reaches the browser, and get_user
  // also returns the user's email and shared libraries.
  return {
    ...EMPTY_USER_ROW,
    user_id: Number(user.user_id),
    user: user.username,
    friendly_name: user.friendly_name,
    user_thumb: user.user_thumb,
  }
}

async function getMediaStats(
  userId: string,
  libraries: TautulliLibrary[],
  since: string,
): Promise<MediaStats> {
  const results = await Promise.all(
    libraries.map(async (library) => {
      const res = await fetchTautulli<{
        recordsFiltered: number
        total_duration: string
      }>('get_history', {
        user_id: userId,
        after: since,
        length: 0,
        media_type: historyMediaTypeMap[library.section_type],
        section_id: library.section_id,
      })

      return {
        response: res?.response.data,
        type: library.section_type,
      }
    }),
  )
  const stats: MediaStats = {
    shows: { count: 0, duration: null },
    movies: { count: 0, duration: null },
    audio: { count: 0, duration: null },
  }

  for (const library of results) {
    const data = library.response
    const resultType = typeToResultMap[library.type]

    if (resultType && data) {
      stats[resultType].count += data.recordsFiltered
      stats[resultType].duration =
        (stats[resultType].duration ?? 0) + timeToSeconds(data.total_duration)
    }
  }

  return stats
}

async function getTopMediaItems(
  userId: string,
  libraries: TautulliLibrary[],
  since: string,
): Promise<TopMediaItems> {
  // get_home_stats only reliably accepts a `time_range` in days (Tautulli
  // computes the window as `last N days` from today), so the rewind window
  // always runs from `since` up to now.
  const time_range = daysBetween(since)
  const res = await Promise.all(
    libraries.map(async (library) => {
      const stat = await fetchTautulli<TautulliItem>('get_home_stats', {
        stat_id: statIdMap[library.section_type],
        user_id: userId,
        section_id: library.section_id,
        time_range,
        stats_count: 5,
        stats_type: 'duration',
      })

      return { stat, type: library.section_type }
    }),
  )
  const combinedResult: TopMediaItems = {
    shows: [],
    movies: [],
    audio: [],
  }
  const rowsByLibrary = await Promise.all(
    res.map(async ({ stat, type }) => {
      const rows = stat?.response?.data?.rows || []

      if (!rows.length) {
        return rows
      }

      if (type === 'show') {
        return getMediaAdditionalData(rows, 'tv', getTautulliMediaData)
      }

      if (type === 'movie') {
        return getMediaAdditionalData(rows, 'movie', getTautulliMediaData)
      }

      return rows
    }),
  )

  res.forEach(({ type }, i) => {
    // Tautulli also lists other library types, such as photos.
    const resultType = typeToResultMap[type]

    if (resultType) {
      combinedResult[resultType].push(...rowsByLibrary[i])
    }
  })

  function sortAndSlice(list: TautulliItemRow[]) {
    return list.sort((a, b) => b.total_duration - a.total_duration).slice(0, 5)
  }

  combinedResult.shows = sortAndSlice(combinedResult.shows)
  combinedResult.movies = sortAndSlice(combinedResult.movies)
  combinedResult.audio = sortAndSlice(combinedResult.audio)

  return combinedResult
}

// Sums every series ('TV', 'Movies', 'Music', ...) into a single per-category
// total, keeping the same order as `categories`.
function sumGraphSeries(graph?: TautulliGraph): number[] {
  if (!graph?.categories?.length || !Array.isArray(graph.series)) {
    return []
  }

  return graph.categories.map((_, index) =>
    graph.series.reduce((sum, serie) => sum + (serie.data?.[index] ?? 0), 0),
  )
}

async function getPlaysByTime(
  userId: string,
  since: string,
): Promise<PlaysByTime> {
  // Like getTopMediaItems, the graph endpoints only accept a `time_range` in
  // days (last N days from today), so the window runs from `since` up to now.
  const time_range = daysBetween(since)
  const [hourRes, dayRes] = await Promise.all([
    fetchTautulli<TautulliGraph>('get_plays_by_hourofday', {
      user_id: userId,
      time_range,
      y_axis: 'plays',
    }),
    fetchTautulli<TautulliGraph>('get_plays_by_dayofweek', {
      user_id: userId,
      time_range,
      y_axis: 'plays',
    }),
  ])
  // `hourly` already lines up with the hour (categories are '00'..'23').
  const hourly = sumGraphSeries(hourRes?.response?.data)
  const dayData = dayRes?.response?.data
  const dayTotals = sumGraphSeries(dayData)
  // Normalize day-of-week into a fixed Sunday-first order resolved from
  // Tautulli's English labels, whose array order shifts with week_start_monday.
  const daily = Array<number>(7).fill(0)

  dayData?.categories?.forEach((name, position) => {
    const index = DAY_NAME_TO_INDEX[name]

    if (index !== undefined) {
      daily[index] = dayTotals[position]
    }
  })

  return { hourly, daily }
}

const tautulliSource: StatsSource = {
  getServerId,
  getLibraries,
  getLibrariesSize,
  getUsers,
  getServerUser,
  getActivity,
  getTotalDuration,
  getTopItems,
  getTopUsers,
  getPlaysCounts,
  getInactiveUser,
  getMediaStats,
  getTopMediaItems,
  getPlaysByTime,
}

export default tautulliSource
