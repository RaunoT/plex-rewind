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
        statTitle="Listen time"
        statCategory="Music"
        page="4 / 4"
        prevCard="/rewind/movies"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        subtitle="Rauno T"
      >
        <div className="flex flex-col justify-center h-full pb-12">
          <CardHeading>
            And to top it all off, you listened to{' '}
            <span className="inline-block text-3xl font-semibold text-black">
              {secondsToTime(totalTime)}
            </span>{' '}
            of <span className="text-teal-300">Music</span> on{' '}
            <span className="text-yellow-500">Plex</span>.
          </CardHeading>
        </div>
      </CardTop>
    </>
  )
}

export async function getServerSideProps() {
  const tvStats = await fetchTautulli('get_library_user_stats', {
    section_id: 1,
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
