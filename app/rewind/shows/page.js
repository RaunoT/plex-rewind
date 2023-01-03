import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import { FIRST_OF_CURRENT_YEAR } from '../../../utils/constants'
import fetchFromTautulli from '../../../utils/fetchFromTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const totalDuration = await fetchFromTautulli('get_history', {
    user_id: 8898770,
    section_id: 2,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Shows() {
  return (
    <CardContent
      statCategory="TV Shows"
      page="2 / 4"
      prevCard="/rewind/total"
      nextCard="/rewind/movies"
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
      {totalDuration > 0 ? (
        <>
          <span className="inline-flex items-center text-teal-300">
            TV Shows
            <PlayCircleIcon className="w-8 ml-1" />
          </span>{' '}
          took up <span className="rewind-stat">{totalDuration}</span> of your
          year on <span className="text-yellow-500">Plex</span>.
        </>
      ) : (
        <>
          You haven&apos;t watched any{' '}
          <span className="inline-flex items-center text-teal-300">
            TV Shows
            <PlayCircleIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year{' '}
          <span className="not-italic">😥</span>
        </>
      )}
    </CardContentText>
  )
}
