import CardHeading from '../../components/CardHeading/CardHeading'
import CardTop from '../../components/CardTop/CardTop'
import RewindTitle from '../../components/RewindTitle/RewindTitle'
import fetchTautulli from '../../utils/fetchTautulli'
import secondsToTime from '../../utils/secondsToTime'

function RewindTv({ totalTime }) {
  return (
    <>
      <RewindTitle />

      <CardTop
        statTitle="Watch time"
        statCategory="Movies"
        page="3 / 4"
        prevCard="/rewind/tv"
        nextCard="/rewind/music"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        subtitle="Rauno T"
      >
        <div className="flex flex-col justify-center flex-1 pb-12">
          <CardHeading>
            <span className="inline-block text-3xl font-semibold text-black">
              {secondsToTime(totalTime)}
            </span>{' '}
            of your time was spent watching{' '}
            <span className="text-teal-300">Movies</span> on{' '}
            <span className="text-yellow-500">Plex</span> this year.
          </CardHeading>
        </div>
      </CardTop>
    </>
  )
}

export async function getServerSideProps() {
  const tvStats = await fetchTautulli('get_library_user_stats', {
    section_id: 3,
  })

  const tvStatsFiltered = tvStats.response.data.filter(
    (stat) => stat.user_id === 8898770,
  )

  return {
    props: {
      totalTime: tvStatsFiltered[0].total_time,
    },
  }
}

export default RewindTv
