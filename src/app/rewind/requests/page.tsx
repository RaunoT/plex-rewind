import Card from '@/components/Card/Card'
import CardRewind from '@/components/Card/CardRewind'
import StatListItem from '@/components/StatListItem'
import { ExtendedUser, authOptions } from '@/utils/authOptions'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '@/utils/fetchOverseerr'
import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Metadata } from 'next'
import { Session, getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Requests | Plex rewind',
  description: metaDescription,
}

async function getRequestsTotals() {
  const requests = await fetchPaginatedOverseerrStats(
    'request',
    ALLOWED_PERIODS.thisYear.date,
  )

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
  }
}

async function getUserRequestsTotal(userId: string) {
  const overseerrUserId = await fetchOverseerrUserId(userId)
  const userRequestsTotal = await fetchPaginatedOverseerrStats(
    `user/${overseerrUserId}/requests`,
    ALLOWED_PERIODS.thisYear.date,
  )

  return userRequestsTotal.length
}

export default async function Requests() {
  const session = (await getServerSession(authOptions)) as Session & {
    user: ExtendedUser
  }

  if (!session?.user) {
    return
  }

  const [requestTotals, userRequestsTotal] = await Promise.all([
    getRequestsTotals(),
    getUserRequestsTotal(session.user.id),
  ])

  return (
    <Card
      title='Requests'
      page='2 / 5'
      prevCard='/rewind/totals'
      nextCard='/rewind/shows'
      subtitle={session.user.name}
    >
      {userRequestsTotal != 0 ? (
        <CardRewind hideAfter={requestTotals.total != 0 ? 10 : 0}>
          <p>
            You&apos;ve made{' '}
            <span className='rewind-stat'>{userRequestsTotal}</span> content{' '}
            <span className='rewind-cat'>
              Requests
              <QuestionMarkCircleIcon />
            </span>{' '}
            this year.
          </p>
        </CardRewind>
      ) : (
        <CardRewind hideAfter={requestTotals.total != 0 ? 10 : 0}>
          <p>
            You haven&apos;t made any content{' '}
            <span className='rewind-cat'>
              Requests
              <QuestionMarkCircleIcon />
            </span>{' '}
            this year! You can make them via{' '}
            <a
              className='link'
              href={process.env.NEXT_PUBLIC_OVERSEERR_URL}
              target='_blank'
              rel='noopener noreferrer'
            >
              media.rauno.eu
            </a>
          </p>
        </CardRewind>
      )}

      <CardRewind renderDelay={5} noScale={requestTotals.total == 0}>
        <p>
          Altogether there have been{' '}
          <span className='rewind-stat'>{requestTotals.total}</span>{' '}
          <span className='rewind-cat'>
            Requests
            <QuestionMarkCircleIcon />
          </span>{' '}
          this year.
        </p>
      </CardRewind>

      {requestTotals.total != 0 && (
        <CardRewind renderDelay={10} loaderDelay={5} noScale>
          <p>That includes:</p>
          <ul className='list'>
            <StatListItem
              count={requestTotals.movies}
              name='Movies'
              icon={<FilmIcon />}
              separator='for'
            />
            <StatListItem
              count={requestTotals.shows}
              name='Shows'
              icon={<PlayCircleIcon />}
              separator='for'
            />
          </ul>
        </CardRewind>
      )}
    </Card>
  )
}
