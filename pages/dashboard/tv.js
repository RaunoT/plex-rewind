import CardTop from '../../components/CardTop/CardTop'
import DashboardTitle from '../../components/DashboardTitle/DashboardTitle'
import fetchRatings from '../../utils/fetchRatings'
import fetchTautulli from '../../utils/fetchTautulli'

function DashboardTv({ shows, ratings, totalDuration }) {
  return (
    <>
      <DashboardTitle />

      <CardTop
        statTitle="Most watched"
        statCategory="TV shows"
        page="1 / 4"
        items={shows}
        nextCard="/dashboard/movies"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        totalDuration={totalDuration}
        ratings={ratings}
      />
    </>
  )
}

export async function getServerSideProps() {
  const shows = await fetchTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchTautulli('get_history', {
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
      totalDuration: totalDuration.response.data.total_duration.replace(
        /mins.*/,
        'mins',
      ),
    },
  }
}

export default DashboardTv
