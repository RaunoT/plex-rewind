import Card from '@/components/Card'
import CardText from '@/components/CardText'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import fetchUser from '@/utils/fetchUser'
import { removeAfterMinutes } from '@/utils/formatting'
import { FilmIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Movies | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration() {
  const userData = await fetchUser()
  const { user } = userData
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: user.id,
      section_id: 3,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Movies() {
  const [totalDuration, user] = await Promise.all([
    getTotalDuration(),
    fetchUser(),
  ])

  return (
    <Card
      title='Movies'
      page='4 / 5'
      prevCard='/rewind/shows'
      nextCard='/rewind/music'
      subtitle={user.plexUsername}
    >
      <CardText noScale>
        {totalDuration ? (
          <p>
            <span className='rewind-stat'>{totalDuration}</span> of your time
            was spent watching{' '}
            <span className='inline-flex text-teal-300'>
              Movies
              <FilmIcon className='ml-1 w-8' />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year.
          </p>
        ) : (
          <p>
            You haven&apos;t watched any{' '}
            <span className='inline-flex text-teal-300'>
              Movies
              <FilmIcon className='ml-1 w-8' />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>🥹</span>
          </p>
        )}
      </CardText>
    </Card>
  )
}
