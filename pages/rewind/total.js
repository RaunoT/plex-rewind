import CardHeading from '../../components/CardHeading/CardHeading'
import CardTop from '../../components/CardTop/CardTop'
import RewindTitle from '../../components/RewindTitle/RewindTitle'
import fetchTautulli from '../../utils/fetchTautulli'
import secondsToTime from '../../utils/secondsToTime'

function RewindTotal({ totalTime }) {
  return (
    <>
      <RewindTitle />

      <CardTop
        statTitle="Watch time"
        statCategory="Total"
        page="1 / 4"
        nextCard="/rewind/tv"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
        subtitle="Rauno T"
      >
        <div className="flex flex-col justify-center flex-1 pb-12">
          <CardHeading>
            You&apos;ve spent a <span className="text-teal-300">total</span> of{' '}
            <span className="inline-block text-3xl font-semibold text-black">
              {secondsToTime(totalTime)}
            </span>{' '}
            on <span className="text-yellow-500">Plex</span> this year!
          </CardHeading>
        </div>
      </CardTop>
    </>
  )
}

export async function getServerSideProps() {
  const totalTime = await fetchTautulli('get_user_watch_time_stats', {
    user_id: 8898770,
    query_days: 0,
  })

  return {
    props: {
      totalTime: totalTime.response.data[0].total_time,
    },
  }
}

export default RewindTotal
