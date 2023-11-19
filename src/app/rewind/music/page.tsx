import Card from '@/components/Card/Card'
import CardText from '@/components/Card/CardText'
import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli from '@/utils/fetchTautulli'
import { removeAfterMinutes } from '@/utils/formatting'
import { MusicalNoteIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { Session, getServerSession } from 'next-auth'

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
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

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
            <span className='rewind-cat'>
              Music
              <MusicalNoteIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span>.
          </p>
        ) : (
          <p>
            You haven&apos;t listened to any{' '}
            <span className='rewind-cat'>
              Music
              <MusicalNoteIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>🥵</span>
          </p>
        )}
      </CardText>
    </Card>
  )
}
