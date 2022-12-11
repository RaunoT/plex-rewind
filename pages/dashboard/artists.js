import CardTop from '../../components/CardTop/CardTop'
import DashboardTitle from '../../components/DashboardTitle/DashboardTitle'
import fetchTautulli from '../../utils/fetchTautulli'

function DashboardArtists({ artists, totalDuration }) {
  return (
    <>
      <DashboardTitle />

      <CardTop
        statTitle="Most played"
        statCategory="artists"
        page="3 / 4"
        items={artists}
        prevCard="/dashboard/movies"
        nextCard="/dashboard/users"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        totalDuration={totalDuration}
      />
    </>
  )
}

export async function getServerSideProps() {
  const artists = await fetchTautulli('get_home_stats', {
    stat_id: 'top_music',
    stats_count: 5,
    stats_type: 'duration',
  })
  const totalDuration = await fetchTautulli('get_history', {
    media_type: 'track',
    length: 0,
  })

  return {
    props: {
      artists: artists.response.data,
      totalDuration: totalDuration.response.data.total_duration.replace(
        /mins.*/,
        'mins',
      ),
    },
  }
}

export default DashboardArtists
