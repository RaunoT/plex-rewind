import CardContent from '../../../ui/CardContent'
import { ALLOWED_PERIODS } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getMovies(period) {
  const movies = await fetchTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })

  return movies.response?.data?.rows
}

async function getTotalDuration(period) {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 3,
    after: period,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 3,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

async function getRatings(period) {
  const movies = await getMovies(period)

  const ratings = Promise.all(
    movies.map(async (movie) => {
      const movieData = await fetchTautulli('get_metadata', {
        rating_key: movie.rating_key,
        year: movie.year,
      })

      return {
        title: movie.title,
        rating: movieData.response?.data.audience_rating,
      }
    }),
  )

  return ratings
}

export default async function Movies({ searchParams }) {
  let period = ALLOWED_PERIODS['30days']
  if (ALLOWED_PERIODS[searchParams.period]) {
    period = ALLOWED_PERIODS[searchParams.period]
  }

  const [movies, totalDuration, totalSize, ratings] = await Promise.all([
    getMovies(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
    getRatings(period.daysAgo),
  ])

  return (
    <CardContent
      title="Movies"
      items={movies}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard="dashboard/shows"
      nextCard="dashboard/artists"
      page="2 / 4"
      type="movies"
      ratings={ratings}
    />
  )
}
