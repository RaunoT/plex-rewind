import CardContent from '../../../ui/CardContent'
import { DAYS_AGO_30_STRING } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import fetchTmdb from '../../../utils/fetchTmdb'
import { bytesToSize, removeAfterMinutes } from '../../../utils/formatting'

async function getMovies() {
  const movies = await fetchTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 6,
    stats_type: 'duration',
    time_range: 30,
  })

  return movies.response?.data?.rows
}

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 3,
    after: DAYS_AGO_30_STRING,
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

async function getRatings() {
  const movies = await getMovies()

  const ratings = Promise.all(
    movies.map(async (movie) => {
      const movieData = await fetchTmdb('search/movie', {
        query: movie.title,
        year: movie.year,
      })

      return {
        title: movie.title,
        rating: movieData.results[0]?.vote_average,
      }
    }),
  )

  return ratings
}

export default async function Movies() {
  const [movies, totalDuration, totalSize, ratings] = await Promise.all([
    getMovies(),
    getTotalDuration(),
    getTotalSize(),
    getRatings(),
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
