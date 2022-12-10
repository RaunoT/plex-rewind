import CardTop from '../../components/CardTop/CardTop'
import fetchStats from '../../utils/fetchStats'

function MostActiveUsers({ users, totalDuration }) {
  return (
    <>
      <h1 className="mb-4 text-xl font-bold uppercase sm:text-2xl">
        Dashboard
      </h1>

      <CardTop
        statTitle="Most active"
        statCategory="Users"
        page="4 / 4"
        items={users}
        period="Last 30 days"
        prevCard="/rewind/top-artists"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        totalDuration={totalDuration}
        users
      />
    </>
  )
}

export async function getStaticProps() {
  const users = await fetchStats('get_home_stats', {
    stat_id: 'top_users',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchStats('get_history', { length: 0 })

  return {
    props: {
      users: users.response.data,
      totalDuration: totalDuration.response.data.total_duration,
    },
  }
}

export default MostActiveUsers
