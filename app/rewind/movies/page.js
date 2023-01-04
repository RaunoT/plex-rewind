import { FilmIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import { FIRST_OF_CURRENT_YEAR } from '../../../utils/constants'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const totalDuration = await fetchTautulli('get_history', {
    user_id: 8898770,
    section_id: 3,
    after: FIRST_OF_CURRENT_YEAR,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Movies() {
  return (
    <CardContent
      statCategory="Movies"
      page="4 / 5"
      prevCard="/rewind/shows"
      nextCard="/rewind/music"
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
      {totalDuration !== '0' ? (
        <>
          <span className="rewind-stat">{totalDuration}</span> of your time was
          spent watching{' '}
          <span className="inline-flex text-teal-300">
            Movies
            <FilmIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year.
        </>
      ) : (
        <>
          You haven&apos;t watched any{' '}
          <span className="inline-flex text-teal-300">
            Movies
            <FilmIcon className="w-8 ml-1" />
          </span>{' '}
          on <span className="text-yellow-500">Plex</span> this year{' '}
          <span className="not-italic">🥹</span>
        </>
      )}
    </CardContentText>
  )
}
