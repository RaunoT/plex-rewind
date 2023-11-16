import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Card from '@/components/Card'
import CardText from '@/components/CardText'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { removeAfterMinutes } from '@/utils/formatting'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Music | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration(plexId: string) {
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: plexId,
      section_id: 1,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Music() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return
  }

  const [totalDuration] = await Promise.all([getTotalDuration(session.user.id)])

  return (
    <Card
      title='Music'
      page='5 / 5'
      prevCard='/rewind/movies'
      subtitle={session.user.name}
    >
      <CardText noScale>
        {totalDuration ? (
          <p>
            And to top it all off, you listened to&nbsp;
            <span className='rewind-stat'>{totalDuration}</span> of{' '}
            <span className='inline-flex items-center text-teal-300'>
              Music
              <MusicalNoteIcon className='ml-1 w-8' />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> during{' '}
            <span className='rewind-stat text-purple-300'>
              {new Date().getFullYear()}
            </span>
            .
          </p>
        ) : (
          <p>
            You haven&apos;t listened to any{' '}
            <span className='inline-flex items-center text-teal-300'>
              Music
              <MusicalNoteIcon className='ml-1 w-8' />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>🥵</span>
          </p>
        )}
      </CardText>
    </Card>
  )
}
