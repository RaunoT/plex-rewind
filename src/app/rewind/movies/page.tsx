import Card from '@/components/Card'
import CardText from '@/components/CardText'
import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { removeAfterMinutes } from '@/utils/formatting'
import { FilmIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { Session, getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Movies | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration(userId: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      section_id: 3,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Movies() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const [totalDuration] = await Promise.all([getTotalDuration(session.user.id)])

  return (
    <Card
      title='Movies'
      page='4 / 5'
      prevCard='/rewind/shows'
      nextCard='/rewind/music'
      subtitle={session.user.name}
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
