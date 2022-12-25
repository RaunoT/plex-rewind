import { PlayCircleIcon } from '@heroicons/react/24/outline'
import CardContent from '../../../ui/CardContent'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import CardHeading from '../../../ui/CardHeading'

export default async function Shows() {
  const shows = await fetchFromTautulli('get_home_stats', {
    stat_id: 'top_tv',
    stats_count: 5,
    stats_type: 'duration',
    time_range: 30,
  })

  return (
    <CardContent
      statTitle="Watch time"
      statCategory="TV Shows"
      page="2 / 4"
      prevCard="/rewind/totals"
      nextCard="/rewind/movies"
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 pb-12">
        <CardHeading>
          <span className="inline-flex items-center text-teal-300">
            TV Shows
            <PlayCircleIcon className="w-8 ml-1" />
          </span>{' '}
          took up{' '}
          <span className="inline-block text-3xl font-semibold text-black">
            {rewind.tv.duration}
          </span>{' '}
          of your year on <span className="text-yellow-500">Plex</span>.
        </CardHeading>
      </div>
    </CardContent>
  )
}
