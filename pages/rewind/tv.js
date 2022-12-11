import CardTop from '../../components/CardTop/CardTop'
import fetchTautulli from '../../utils/fetchTautulli'
import secondsToTime from '../../utils/secondsToTime'

function RewindTv({ totalTime }) {
  return (
    <>
      <CardTop
        statTitle="Watch time"
        statCategory="TV Shows"
        page="2 / 4"
        prevCard="/rewind/total"
        nextCard="/rewind/movies"
        className="bg-gradient-to-br from-teal-700 via-indigo-700 to-purple-800"
      >
        <div className="flex flex-col justify-center h-full pb-12">
          <h2 className="text-4xl italic">
            <span className="text-teal-300">TV Shows</span> took up{' '}
            <span className="inline-block text-3xl font-semibold text-black">
              {secondsToTime(totalTime)}
            </span>{' '}
            of that time.
          </h2>
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
