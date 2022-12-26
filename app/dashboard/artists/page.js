import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { DAYS_AGO_30, removeAfterMinutes } from '../../../utils/time'

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

export default async function Artists() {
  const artistsData = getArtists()
  const totalDurationData = getTotalDuration()

  const [artists, totalDuration] = await Promise.all([
    artistsData,
    totalDurationData,
  ])

  return (
    <CardContent
      statTitle="Most played"
      statCategory="Artists"
      items={artists.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      prevCard="dashboard/movies"
      nextCard="dashboard/users"
      page="3 / 4"
      type="music"
    />
  )
}
