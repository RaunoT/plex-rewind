import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import { CURRENT_YEAR_STRING } from '../../../utils/constants'
import { fetchUser } from '../../../utils/fetchOverseerr'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const user = fetchUser()
  const totalDuration = await fetchTautulli('get_history', {
    user_id: user.plexId,
    section_id: 2,
    after: CURRENT_YEAR_STRING,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Shows() {
  return (
    <CardContent
      title="TV Shows"
      page="3 / 5"
      prevCard="/rewind/requests"
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
      {totalDuration != 0 ? (
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
