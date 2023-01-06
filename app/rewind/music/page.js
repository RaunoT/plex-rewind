import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import { FIRST_OF_CURRENT_YEAR } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    user_id: 8898770,
    section_id: 1,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Music() {
  return (
    <CardContent
      title="Music"
      page="5 / 5"
      prevCard="/rewind/movies"
      subtitle="Rauno T"
      rewind
    >
      <Suspense fallback={<CardTextSkeleton />}>
        <Stats promise={getTotalDuration()} />
      </Suspense>
    </CardContent>
  )
}

async function Stats({ promise }) {
  const totalDuration = await promise

  return (
    <CardContentText noScale>
      {totalDuration != 0 ? (
        <>
          And to top it all off, you listened to&nbsp;
          <span className="rewind-stat">{totalDuration}</span> of{' '}
          <span className="inline-flex items-center text-teal-300">
            Music
            <MusicalNoteIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> during{' '}
          <span className="text-purple-300 rewind-stat">
            {new Date().getFullYear()}
          </span>
          .
        </>
      ) : (
        <>
          You haven&apos;t listened to any{' '}
          <span className="inline-flex items-center text-teal-300">
            Music
            <MusicalNoteIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year{' '}
          <span className="not-italic">🥵</span>
        </>
      )}
    </CardContentText>
  )
}
