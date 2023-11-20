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

async function getTopMovies(userId: string, period: number) {
  const moviesRes = await fetchTautulli<TautulliItemRows>('get_home_stats', {
    user_id: userId,
    section_id: 3,
    time_range: period,
    stats_count: 5,
    stats_type: 'duration',
    stat_id: 'top_movies',
  })
  const movies = await getMediaAdditionalData(
    moviesRes.response?.data?.rows,
    'movie',
  )

  return movies
}

export default async function Movies() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const [totalDuration, topMovies, serverId] = await Promise.all([
    getTotalDuration(session.user.id),
    getTopMovies(session.user.id, ALLOWED_PERIODS.thisYear.daysAgo),
    getServerId(),
  ])

  return (
    <Card
      title='Movies'
      page='4 / 5'
      prevCard='/rewind/shows'
      nextCard='/rewind/music'
      subtitle={session.user.name}
    >
      <CardRewind noScale={!topMovies}>
        {totalDuration ? (
          <p>
            <span className='rewind-stat'>{totalDuration}</span> of your time
            was spent watching{' '}
            <span className='rewind-cat'>
              Movies
              <FilmIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span>.
          </p>
        ) : (
          <p>
            You haven&apos;t watched any{' '}
            <span className='rewind-cat'>
              Movies
              <FilmIcon />
            </span>{' '}
            on <span className='text-yellow-500'>Plex</span> this year{' '}
            <span className='not-italic'>🥹</span>
          </p>
        )}
      </CardRewind>

      {topMovies && (
        <CardRewind renderDelay={5} noScale>
          <p className='mb-2'>
            Here&apos;s your <span className='rewind-cat'>Top 5:</span>
          </p>

          <div className='text-base not-italic'>
            <CardMediaItems
              type='movies'
              items={topMovies}
              serverId={serverId}
              personal
            />
          </div>
        </CardRewind>
      )}
    </Card>
  )
}
