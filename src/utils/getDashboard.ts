import { Settings } from '@/types/settings'
import { TautulliItem, TautulliLibrary } from '@/types/tautulli'
import fetchTautulli from './fetchTautulli'
import { bytesToSize, secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData, {
  mapWatchedDataByRatingKey,
} from './getMediaAdditionalData'

export async function getItems(
  library: TautulliLibrary,
  period: number,
  userId?: string,
  sortByPlays?: boolean,
) {
  const sectionType = library.section_type
  const statIdMap = {
    movie: 'top_movies',
    show: 'top_tv',
    artist: 'top_music',
  }
  const popularIdMap = {
    movie: 'popular_movies',
    show: 'popular_tv',
    artist: 'popular_music',
  }
  const itemsRes = await fetchTautulli<TautulliItem>('get_home_stats', {
    stat_id: statIdMap[sectionType],
    stats_count: 6,
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
      stats_count: 100, // https://github.com/Tautulli/Tautulli/issues/2103
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

export async function getTotalDuration(
  library: TautulliLibrary,
  period: string,
  settings: Settings,
  userId?: string,
) {
  if (settings.dashboard.activeTotalStatistics.includes('duration')) {
    const totalDuration = await fetchTautulli<{ total_duration: string }>(
      'get_history',
      {
        section_id: library.section_id,
        after: period,
        length: 0,
        user_id: userId ? userId : '',
      },
    )

    return secondsToTime(
      timeToSeconds(totalDuration?.response?.data?.total_duration || '0'),
    )
  }

  return undefined
}

export async function getTotalSize(
  library: TautulliLibrary,
  settings: Settings,
) {
  if (settings.dashboard.activeTotalStatistics.includes('size')) {
    const totalSize = await fetchTautulli<{ total_file_size: number }>(
      'get_library_media_info',
      {
        section_id: library.section_id,
        length: 0,
      },
    )

    return bytesToSize(totalSize?.response?.data.total_file_size || 0)
  }

  return undefined
}
