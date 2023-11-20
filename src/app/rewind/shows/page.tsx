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
import getMediaAdditionalData from '@/utils/getMediaAdditionalData'
import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { Session, getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Shows | Plex rewind',
  description: metaDescription,
}

async function getTotalDuration(userId: string) {
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

async function getTopShows(userId: string, period: number) {
  const showsRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 2,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_tv',
  })
  const shows = await getMediaAdditionalData(
    showsRes.response?.data?.rows,
    'tv',
  )

  return shows
}

export default async function Shows() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const [totalDuration, topShows, serverId] = await Promise.all([
    getTotalDuration(session.user.id),
    getTopShows(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
    getServerId(),
  ])

  return (
    <Card
      title='TV Shows'
      page='3 / 5'
      prevCard='/rewind/requests'
      nextCard='/rewind/movies'
      subtitle={session.user.name}
    >
      <CardRewind noScale={!topShows}>
        {totalDuration ? (
          <p>
            <span className='rewind-cat'>
              TV Shows
              <PlayCircleIcon />
            </span>{' '}
            took up <span className='rewind-stat'>{totalDuration}</span> of your
            year on <span className='text-yellow-500'>Plex</span>.
          </p>
        ) : (
          <p>
            You haven&apos;t watched any{' '}
            <span className='rewind-cat'>
              TV Shows
              <PlayCircleIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>😥</span>
          </p>
        )}
      </CardRewind>

      {topShows && (
        <CardRewind renderDelay={5} noScale>
          <p className='mb-2'>
            Here&apos;s your <span className='rewind-cat'>Top 5:</span>
          </p>

          <div className='text-base not-italic'>
            <CardMediaItems
              type='movies'
              items={topShows}
              serverId={serverId}
              personal
            />
          </div>
        </CardRewind>
      )}
    </Card>
  )
}
