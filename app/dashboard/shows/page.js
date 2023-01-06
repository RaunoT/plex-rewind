import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30_STRING } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getShows() {
  const shows = await fetchTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 6,
    stats_type: 'duration',
    time_range: 30,
  })

  return shows.response?.data?.rows
}

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 2,
    after: DAYS_AGO_30_STRING,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 2,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Shows() {
  const [shows, totalDuration, totalSize] = await Promise.all([
    getShows(),
    getTotalDuration(),
    getTotalSize(),
  ])

  return (
    <CardContent
      title="TV shows"
      items={shows}
      totalDuration={totalDuration}
      totalSize={totalSize}
      nextCard="dashboard/movies"
      page="1 / 4"
      type="shows"
    />
  )
}
