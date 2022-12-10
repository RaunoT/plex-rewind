import CardTop from '../../components/CardTop/CardTop'
import fetchRatings from '../../utils/fetchRatings'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ shows, ratings, totalDuration }) {
  return (
    <CardTop
      statTitle="Most watched"
      statCategory="TV shows"
      page="1 / 4"
      items={shows}
      period="Last 30 days"
      nextCard="/rewind/top-movies"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
      totalDuration={totalDuration}
      ratings={ratings}
    />
  )
}

export async function getStaticProps() {
  const shows = await fetchStats('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchStats('get_history', {
    media_type: 'episode',
    length: 0,
  })

  let ratingKeys = []
  shows.response.data.rows.forEach((movie) => {
    const ratingKey = movie.rating_key

    ratingKeys.push(ratingKey)
  })
  const ratings = await fetchRatings(ratingKeys)

  return {
    props: {
      shows: shows.response.data,
      ratings,
      totalDuration: totalDuration.response.data.total_duration,
    },
  }
}

export default MostWatchedTv
