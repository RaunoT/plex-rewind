import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardText from '../../../ui/CardText'
import CardTextFallback from '../../../ui/CardTextFallback'
import { FIRST_OF_CURRENT_YEAR } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    user_id: 8898770,
    section_id: 1,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return totalDuration
}

export default async function Music() {
  return (
    <CardContent
      statTitle="Listen time"
      statCategory="Music"
      page="4 / 4"
      prevCard="/rewind/movies"
      subtitle="Rauno T"
    >
      <div className="flex flex-col justify-center flex-1 sm:pb-12">
        <Suspense fallback={<CardTextFallback />}>
          <Stats promise={getTotalDuration()} />
        </Suspense>
      </div>
    </CardContent>
  )
}

async function Stats({ promise }) {
  const totalDuration = await promise

  return (
    <CardText>
      And to top it all off, you listened to&nbsp;
      <span className="inline-block text-3xl font-semibold text-black">
        {removeAfterMinutes(totalDuration.response.data.total_duration)}
      </span>{' '}
      of{' '}
      <span className="inline-flex items-center text-teal-300">
        Music
        <MusicalNoteIcon className="w-8 ml-1" />
      </span>{' '}
      on <span className="text-yellow-500">Plex</span>.
    </CardText>
  )
}
