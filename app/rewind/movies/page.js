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
    section_id: 3,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return totalDuration
}

export default async function Movies() {
  const totalDuration = await getTotalDuration()

  return (
    <CardContent
      statTitle="Watch time"
      statCategory="Movies"
      page="3 / 4"
      prevCard="/rewind/shows"
      nextCard="/rewind/music"
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
      <span className="inline-block text-3xl font-semibold text-black">
        {removeAfterMinutes(totalDuration.response.data.total_duration)}
      </span>{' '}
      of your time was spent watching{' '}
      <span className="inline-flex text-teal-300">
        Movies
        <PlayCircleIcon className="w-8 ml-1" />
      </span>{' '}
      on <span className="text-yellow-500">Plex</span> this year.
    </CardHeading>
  )
}