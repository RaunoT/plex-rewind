import CardTop from '../../components/CardTop/CardTop'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ shows, totalDuration }) {
  return (
    <CardTop
      statTitle="Most watched"
      statCategory="TV shows"
      page="1/4"
      items={shows}
      period="Last 30 days"
      nextCard="/rewind/top-movies"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
      totalDuration={totalDuration}
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

  return {
    props: {
      shows: shows.response.data,
      totalDuration: totalDuration.response.data.total_duration,
    },
  }
}

export default MostWatchedTv
