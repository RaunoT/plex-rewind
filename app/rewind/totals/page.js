import { ClockIcon } from '@heroicons/react/24/solid'
import CardContent from '../../../ui/CardContent'
import CardHeading from '../../../ui/CardHeading'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'

export default async function Totals() {
  const shows = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Watch time"
      statCategory="Total"
      page="1 / 4"
      nextCard={() => {
        setShowTotals(false)
        setShowTv(true)
      }}
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 pb-12">
        <CardHeading>
          You&apos;ve spent a{' '}
          <span className="inline-flex items-center text-teal-300">
            Total
            <ClockIcon className="w-8 ml-1" />
          </span>{' '}
          of{' '}
          <span className="inline-block text-3xl font-semibold text-black">
            {rewind.totals.duration}
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year!
        </CardHeading>
      </div>
    </CardContent>
  )
}
