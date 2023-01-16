import { PlayCircleIcon } from '@heroicons/react/24/outline'
import CardContent from '../../../ui/CardContent'
import CardContentText from '../../../ui/CardContentText'
import { ALLOWED_PERIODS } from '../../../utils/constants'
import { fetchUser } from '../../../utils/fetchOverseerr'
import fetchTautulli from '../../../utils/fetchTautulli'
import { removeAfterMinutes } from '../../../utils/formatting'

async function getTotalDuration() {
  const user = await fetchUser()
  const totalDuration = await fetchTautulli('get_history', {
    user_id: user.plexId,
    section_id: 2,
    after: ALLOWED_PERIODS.thisYear.string,
    length: 0,
  })

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Shows() {
  const [totalDuration, user] = await Promise.all([
    getTotalDuration(),
    fetchUser(),
  ])

  return (
    <CardContent
      title="TV Shows"
      page="3 / 5"
      prevCard="/rewind/requests"
      nextCard="/rewind/movies"
      subtitle={user.plexUsername}
    >
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
    </CardContent>
  )
}
