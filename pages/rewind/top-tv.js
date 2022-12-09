import CardMostWatchedItems from '../../components/CardMostWatchedItems/CardMostWatchedItems'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ shows }) {
  return (
    <CardMostWatchedItems
      statTitle="Most watched"
      statCategory="TV shows"
      page="1/3"
      items={shows}
      period="2022"
      nextCard="/rewind/top-movies"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
    />
  )
}

export async function getStaticProps() {
  let shows = await fetchStats('get_home_stats')

  shows = shows.response.data
    // Get only shows
    .filter((stat) => stat.stat_id === 'top_tv')[0]
    // Keep top 5
    .rows.slice(0, 5)
    // Sort by view duration (desc)
    .sort((a, b) => b.total_duration - a.total_duration)

  return {
    props: {
      shows,
    },
  }
}

export default MostWatchedTv
