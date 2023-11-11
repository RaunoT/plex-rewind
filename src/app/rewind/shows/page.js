import CardContent from '@/components/CardContent'
import CardContentText from '@/components/CardContentText'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import { fetchUser } from '@/utils/fetchOverseerr'
import fetchTautulli from '@/utils/fetchTautulli'
import { removeAfterMinutes } from '@/utils/formatting'
import { PlayCircleIcon } from '@heroicons/react/24/outline'

export const metadata = {
  title: 'Shows | Plex rewind',
  description: metaDescription,
}

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
      title='TV Shows'
      page='3 / 5'
      prevCard='/rewind/requests'
      nextCard='/rewind/movies'
      subtitle={user.plexUsername}
    >
      <CardContentText noScale>
        {totalDuration != 0 ? (
          <p>
            <span className='inline-flex items-center text-teal-300'>
              TV Shows
              <PlayCircleIcon className='ml-1 w-8' />
            </span>{' '}
            took up <span className='rewind-stat'>{totalDuration}</span> of your
            year on <span className='text-yellow-500'>Plex</span>.
          </p>
        ) : (
          <p>
            You haven&apos;t watched any{' '}
            <span className='inline-flex items-center text-teal-300'>
              TV Shows
              <PlayCircleIcon className='ml-1 w-8' />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>😥</span>
          </p>
        )}
      </CardContentText>
    </CardContent>
  )
}
