import { MusicalNoteIcon } from '@heroicons/react/24/outline'
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
      statTitle="Listen time"
      statCategory="Music"
      page="4 / 4"
      prevCard={() => {
        setShowMusic(false)
        setShowMovies(true)
      }}
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 pb-12">
        <CardHeading>
          And to top it all off, you listened to&nbsp;
          <span className="inline-block text-3xl font-semibold text-black">
            {rewind.music.duration}
          </span>{' '}
          of{' '}
          <span className="inline-flex items-center text-teal-300">
            Music
            <MusicalNoteIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span>.
        </CardHeading>
      </div>
    </CardContent>
  )
}
