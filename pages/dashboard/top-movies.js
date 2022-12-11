import CardTop from '../../components/CardTop/CardTop'
import DashboardTitle from '../../components/DashboardTitle/DashboardTitle'
import fetchRatings from '../../utils/fetchRatings'
import fetchTautulli from '../../utils/fetchTautulli'

function MostWatchedMovies({ movies, ratings, totalDuration }) {
  return (
    <>
      <DashboardTitle />

      <CardTop
        statTitle="Most watched"
        statCategory="movies"
        page="2 / 4"
        items={movies}
        prevCard="/dashboard/top-tv"
        nextCard="/dashboard/top-artists"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        totalDuration={totalDuration}
        ratings={ratings}
      />
    </>
  )
}

export async function getServerSideProps() {
  const movies = await fetchTautulli('get_home_stats', {
    stat_id: 'top_movies',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchTautulli('get_history', {
    media_type: 'movie',
    length: 0,
  })

  let ratingKeys = []
  movies.response.data.rows.forEach((movie) => {
    const ratingKey = movie.rating_key

    ratingKeys.push(ratingKey)
  })

  const ratings = await fetchRatings(ratingKeys)

  return {
    props: {
      movies: movies.response.data,
      ratings,
      totalDuration: totalDuration.response.data.total_duration,
    },
  }
}

export default MostWatchedMovies
