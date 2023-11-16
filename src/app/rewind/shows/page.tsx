import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Card from '@/components/Card'
import CardText from '@/components/CardText'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { removeAfterMinutes } from '@/utils/formatting'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Shows | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration(userId) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: userId,
      section_id: 2,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Shows() {
  const session = await getServerSession(authOptions)
  const [totalDuration] = await Promise.all([
    getTotalDuration(session?.user.id),
  ])

  return (
    <Card
      title='TV Shows'
      page='3 / 5'
      prevCard='/rewind/requests'
      nextCard='/rewind/movies'
      subtitle={session.user.name}
    >
      <CardText noScale>
        {totalDuration ? (
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
      </CardText>
    </Card>
  )
}
