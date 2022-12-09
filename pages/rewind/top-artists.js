import CardMostWatchedItems from '../../components/CardMostWatchedItems/CardMostWatchedItems'
import fetchStats from '../../utils/fetchStats'

function MostWatchedTv({ artists }) {
  return (
    <CardMostWatchedItems
      statTitle="Most played"
      statCategory="artists"
      page="3/3"
      items={artists}
      period="2022"
      prevCard="/rewind/top-movies"
      className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
    />
  )
}

export async function getStaticProps() {
  let artists = await fetchStats('get_home_stats')

  artists = artists.response.data
    // Get only artists
    .filter((stat) => stat.stat_id === 'top_music')[0]
    // Keep top 5
    .rows.slice(0, 5)
    // Sort by view duration (desc)
    .sort((a, b) => b.total_duration - a.total_duration)

  return {
    props: {
      artists,
    },
  }
}

export default MostWatchedTv
