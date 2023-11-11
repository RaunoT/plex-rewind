import CardContent from '@/components/CardContent'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { bytesToSize, secondsToTime, timeToSeconds } from '@/utils/formatting'

export const metadata = {
  title: 'Music | Plex rewind dashboard',
  description: metaDescription,
}

async function getArtists(period) {
  const artistsData = await fetchTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const artists = artistsData.response?.data?.rows
  const usersListened = await fetchTautulli('get_home_stats', {
    stat_id: 'popular_music',
    // https://github.com/Tautulli/Tautulli/issues/2103
    stats_count: 25,
    time_range: period,
  })
  const usersListenedData = usersListened.response?.data?.rows

  artists.map((artist) => {
    const listenedData = usersListenedData.find(
      (uw) => uw.rating_key === artist.rating_key,
    )

    artist.users_watched = listenedData?.users_watched
  })

  return artists
}

async function getTotalDuration(period) {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 1,
    after: period,
    length: 0,
  })

  return secondsToTime(
    timeToSeconds(totalDuration.response?.data?.total_duration),
  )
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 1,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Music({ searchParams }) {
  let period = ALLOWED_PERIODS['30days']
  if (ALLOWED_PERIODS[searchParams.period]) {
    period = ALLOWED_PERIODS[searchParams.period]
  }

  const [artists, totalDuration, totalSize] = await Promise.all([
    getArtists(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
  ])

  return (
    <CardContent
      title='Music'
      items={artists}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard='/dashboard/movies'
      nextCard='/dashboard/users'
      page='3 / 4'
      type='music'
    />
  )
}
