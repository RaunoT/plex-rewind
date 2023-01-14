import CardContent from '../../../ui/CardContent'
import { ALLOWED_PERIODS } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getArtists(period) {
  const artists = await fetchTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })

  return artists.response?.data?.rows
}

async function getTotalDuration(period) {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 1,
    after: period,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 1,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Artists({ searchParams }) {
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
      title="Music"
      items={artists}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard="dashboard/movies"
      nextCard="dashboard/users"
      page="3 / 4"
      type="music"
    />
  )
}
