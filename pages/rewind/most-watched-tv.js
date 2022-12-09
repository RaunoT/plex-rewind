import CardMostWatchedTV from '../../components/CardMostWatchedTv/CardMostWatchedTv'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ shows }) {
  return <CardMostWatchedTV shows={shows} />
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
