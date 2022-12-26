import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30 } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getMovies() {
  const movies = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return movies
}

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    section_id: 3,
    after: DAYS_AGO_30,
    length: 0,
  })

  return totalDuration
}

async function getTotalSize() {
  const totalSize = await fetchFromTautulli('get_library_media_info', {
    section_id: 3,
    length: 0,
  })

  return totalSize
}

export default async function Movies() {
  const [movies, totalDuration, totalSize] = await Promise.all([
    getMovies(),
    getTotalDuration(),
    getTotalSize(),
  ])

  return (
    <CardContent
      statTitle="Most watched"
      statCategory="Movies"
      items={movies.response.data.rows}
      totalDuration={removeAfterMinutes(
        totalDuration.response.data.total_duration,
      )}
      totalSize={bytesToSize(totalSize.response.data.total_file_size)}
      prevCard="dashboard/shows"
      nextCard="dashboard/artists"
      page="2 / 4"
      type="movies"
    />
  )
}
