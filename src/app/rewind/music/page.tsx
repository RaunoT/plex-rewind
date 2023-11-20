import Card from '@/components/Card/Card'
import CardMediaItems from '@/components/Card/CardMediaItems'
import CardRewind from '@/components/Card/CardRewind'
import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import fetchTautulli, {
  TautulliItemRows,
  getServerId,
} from '@/utils/fetchTautulli'
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

async function getTopArtists(userId: string, period: number) {
  const artistsRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 1,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_music',
  })

  return artistsRes.response?.data?.rows
}

export default async function Music() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const [totalDuration, topArtists, serverId] = await Promise.all([
    getTotalDuration(session.user.id),
    getTopArtists(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
    getServerId(),
  ])

  return (
    <Card
      title='Music'
      page='5 / 5'
      prevCard='/rewind/movies'
      subtitle={session.user.name}
    >
      <CardRewind noScale={!topArtists}>
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
      </CardRewind>

      {topArtists && (
        <CardRewind renderDelay={5} noScale>
          <p className='mb-2'>
            Here&apos;s your <span className='rewind-cat'>Top 5:</span>
          </p>

          <div className='text-base not-italic'>
            <CardMediaItems
              type='movies'
              items={topArtists}
              serverId={serverId}
              personal
            />
          </div>
        </CardRewind>
      )}
    </Card>
  )
}
