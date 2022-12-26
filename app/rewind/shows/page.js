import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardHeading from '../../../ui/CardHeading'
import CardHeadingFallback from '../../../ui/CardHeadingFallback'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { FIRST_OF_CURRENT_YEAR, removeAfterMinutes } from '../../../utils/time'

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    user_id: 8898770,
    section_id: 2,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return totalDuration
}

export default async function Shows() {
  return (
    <CardContent
      statTitle="Watch time"
      statCategory="TV Shows"
      page="2 / 4"
      prevCard="/rewind/total"
      nextCard="/rewind/movies"
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 pb-12">
        <Suspense fallback={<CardHeadingFallback />}>
          <TotalDuration promise={getTotalDuration()} />
        </Suspense>
      </div>
    </CardContent>
  )
}

async function TotalDuration({ promise }) {
  const totalDuration = await promise

  return (
    <CardHeading>
      <span className="inline-flex items-center text-teal-300">
        TV Shows
        <PlayCircleIcon className="w-8 ml-1" />
      </span>{' '}
      took up{' '}
      <span className="inline-block text-3xl font-semibold text-black">
        {removeAfterMinutes(totalDuration.response.data.total_duration)}
      </span>{' '}
      of your year on <span className="text-yellow-500">Plex</span>.
    </CardHeading>
  )
}
