import CardContent from '@/components/CardContent'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli, { getServerId } from '@/utils/fetchTautulli'
import fetchTmdb from '@/utils/fetchTmdb'
import { bytesToSize, secondsToTime, timeToSeconds } from '@/utils/formatting'

export const metadata = {
  title: 'Movies | Plex rewind dashboard',
  description: metaDescription,
}

type Movie = {
  rating_key: string
  title: string
  year: string
  is_deleted: boolean
  rating: string
  tmdb_id: number
  imdb_id: string
}

async function getMovies(period: string): Promise<Movie[]> {
  const moviesData = await fetchTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 6,
    stats_type: 'duration',
    time_range: period,
  })
  const movies = moviesData.response?.data?.rows
  const ratingKeys: string[] = []

  movies.map((movie) => {
    ratingKeys.push(movie.rating_key)
  })

  const additionalData = await Promise.all(
    ratingKeys.map(async (key, i) => {
      const movieTautulli = await fetchTautulli(
        'get_metadata',
        {
          rating_key: key,
        },
        true
      )
      const movieTautulliData = movieTautulli.response?.data
      // Tautulli doesn't return rating for removed items, so we're using TMDB
      const movieTmdb = await fetchTmdb('search/movie', {
        query: movies[i].title,
        first_air_date_year: movies[i].year,
      })
      const tmdb_id = movieTmdb.results[0].id
      const imdb_id = await fetchTmdb(`movie/${tmdb_id}/external_ids`)

      return {
        is_deleted: Object.keys(movieTautulliData).length === 0,
        rating: parseFloat(movieTmdb.results[0].vote_average).toFixed(1),
        tmdb_id: tmdb_id,
        imdb_id: imdb_id.imdb_id,
      }
    })
  )

  movies.map((movie, i) => {
    movie.is_deleted = additionalData[i].is_deleted
    movie.rating = additionalData[i].rating
    movie.tmdb_id = additionalData[i].tmdb_id
    movie.imdb_id = additionalData[i].imdb_id
  })

  return movies
}

async function getTotalDuration(period: string): Promise<string> {
  const totalDuration = await fetchTautulli('get_history', {
    section_id: 3,
    after: period,
    length: 0,
  })

  return secondsToTime(
    timeToSeconds(totalDuration.response?.data?.total_duration)
  )
}

async function getTotalSize() {
  const totalSize = await fetchTautulli('get_library_media_info', {
    section_id: 3,
    length: 0,
  })

  return bytesToSize(totalSize.response?.data.total_file_size)
}

export default async function Movies({ searchParams }) {
  let period = ALLOWED_PERIODS['30days']
  if (ALLOWED_PERIODS[searchParams.period]) {
    period = ALLOWED_PERIODS[searchParams.period]
  }

  const [movies, totalDuration, totalSize, serverId] = await Promise.all([
    getMovies(period.daysAgo),
    getTotalDuration(period.string),
    getTotalSize(),
    getServerId(),
  ])

  return (
    <CardContent
      title='Movies'
      items={movies}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard='/dashboard/shows'
      nextCard='/dashboard/music'
      page='2 / 4'
      type='movies'
      serverId={serverId}
    />
  )
}
