import CardTop from '../../components/CardTop/CardTop'
import fetchStats from '../../utils/fetchStats'

function MostWatchedMovies({ movies, totalDuration }) {
  return (
    <CardTop
      statTitle="Most watched"
      statCategory="movies"
      page="2/4"
      items={movies}
      period="Last 30 days"
      prevCard="/rewind/top-tv"
      nextCard="/rewind/top-artists"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
      totalDuration={totalDuration}
    />
  )
}

export async function getStaticProps() {
  const movies = await fetchStats('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchStats('get_history', {
    media_type: 'movie',
    length: 0,
  })

  return {
    props: {
      movies: movies.response.data,
      totalDuration: totalDuration.response.data.total_duration,
    },
  }
}

export default MostWatchedMovies
