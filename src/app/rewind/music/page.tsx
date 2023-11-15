import Card from '@/components/Card'
import CardText from '@/components/CardText'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import fetchUser from '@/utils/fetchUser'
import { removeAfterMinutes } from '@/utils/formatting'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Music | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration() {
  const userData = await fetchUser()
  const { user } = userData
  const totalDuration = await fetchTautulli<{ total_duration: string }>(
    'get_history',
    {
      user_id: user.id,
      section_id: 1,
      after: ALLOWED_PERIODS.thisYear.string,
      length: 0,
    },
  )

  return removeAfterMinutes(totalDuration.response?.data?.total_duration)
}

export default async function Music() {
  const [totalDuration, user] = await Promise.all([
    getTotalDuration(),
    fetchUser(),
  ])

  return (
    <Card
      title='Music'
      page='5 / 5'
      prevCard='/rewind/movies'
      subtitle={user.plexUsername}
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
