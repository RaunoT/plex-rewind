import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30 } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getArtists() {
  const artists = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return artists
}

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 1,
    after: DAYS_AGO_30,
    length: 0,
  })

  return totalDuration
}

async function getTotalSize() {
  const totalSize = await fetchFromTautulli('get_library_media_info', {
    section_id: 1,
    length: 0,
  })

  return totalSize
}

export default async function Artists() {
  const [artists, totalDuration, totalSize] = await Promise.all([
    getArtists(),
    getTotalDuration(),
    getTotalSize(),
  ])

  return (
    <CardContent
      statTitle="Most played"
      statCategory="Artists"
      items={artists.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      totalSize={bytesToSize(totalSize.response.data.total_file_size)}
      prevCard="dashboard/movies"
      nextCard="dashboard/users"
      page="3 / 4"
      type="music"
    />
  )
}
