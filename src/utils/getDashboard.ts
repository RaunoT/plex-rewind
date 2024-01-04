import { Library, TautulliItem } from '@/types'
import fetchTautulli from './fetchTautulli'
import { bytesToSize, secondsToTime, timeToSeconds } from './formatting'
import getMediaAdditionalData from './getMediaAdditionalData'

export async function getItems(library: Library, period: number) {
  let items = []
  const sectionType = library.section_type
  const statIdMap = {
    movie: 'top_movies',
    show: 'top_tv',
    artist: 'top_music',
  }
  const itemsRes = await fetchTautulli<TautulliItem>('get_home_stats', {
    stat_id: statIdMap[sectionType],
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
    section_id: library.section_id,
  })

  if (sectionType === 'movie' || sectionType === 'show') {
    items = await getMediaAdditionalData(
      itemsRes.response?.data?.rows,
      sectionType === 'movie' ? 'movie' : 'tv',
    )
  } else {
    items = itemsRes.response?.data?.rows
  }

  if (sectionType === 'show') {
    const usersWatched = await fetchTautulli<TautulliItem>('get_home_stats', {
      stat_id: 'popular_tv',
      stats_count: 50, // https://github.com/Tautulli/Tautulli/issues/2103
      time_range: period,
    })
    const usersWatchedData = usersWatched.response?.data?.rows
    const shows = await getMediaAdditionalData(
      itemsRes.response?.data?.rows,
      'tv',
      usersWatchedData,
    )

    items = shows
  }

  if (sectionType === 'artist') {
    const artists = itemsRes.response?.data?.rows
    const usersListened = await fetchTautulli<TautulliItem>('get_home_stats', {
      stat_id: 'popular_music',
      stats_count: 50, // https://github.com/Tautulli/Tautulli/issues/2103
      time_range: period,
    })
    const usersListenedData = usersListened.response?.data?.rows

    artists.map((artist) => {
      const listenedData = usersListenedData.find(
        (uw) => uw.rating_key === artist.rating_key,
      )

      artist.users_watched = listenedData?.users_watched
    })

    items = artists
  }

  return items
}

export async function getTotalDuration(library: Library, period: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      section_id: library.section_id,
      after: period,
      length: 0,
    },
  )

  return secondsToTime(
    timeToSeconds(totalDuration.response?.data?.total_duration),
  )
}

export async function getTotalSize(library: Library) {
  const totalSize = await fetchTautulli<{ total_file_size: number }>(
    'get_library_media_info',
    {
      section_id: library.section_id,
      length: 0,
    },
  )

  return bytesToSize(totalSize.response?.data.total_file_size)
}
