import CardTop from '../../components/CardTop/CardTop'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ users }) {
  return (
    <CardTop
      statTitle="Most active"
      statCategory="Users"
      page="4/4"
      items={users}
      period="Last 30 days"
      prevCard="/rewind/top-artists"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
      users
    />
  )
}

export async function getStaticProps() {
  let users = await fetchStats('get_home_stats')

  users = users.response.data
    // Get only users
    .filter((stat) => stat.stat_id === 'top_users')[0]
    // Keep top 5
    .rows.slice(0, 5)
    // Sort by view duration (desc)
    .sort((a, b) => b.total_duration - a.total_duration)

  return {
    props: {
      users,
    },
  }
}

export default MostWatchedTv
