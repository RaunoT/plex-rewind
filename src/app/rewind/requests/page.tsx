import Card from '@/components/Card'
import CardText from '@/components/CardText'
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
        <CardText hideAfter={requestTotals.total != 0 ? 10 : 0}>
          <p>
            You&apos;ve made{' '}
            <span className='rewind-stat'>{userRequestsTotal}</span> content{' '}
            <span className='inline-flex items-center text-teal-300'>
              Requests
              <QuestionMarkCircleIcon className='ml-1 w-8' />
            </span>{' '}
            this year.
          </p>
        </CardText>
      ) : (
        <CardText hideAfter={requestTotals.total != 0 ? 10 : 0}>
          <p>
            You haven&apos;t made any content{' '}
            <span className='inline-flex items-center text-teal-300'>
              Requests
              <QuestionMarkCircleIcon className='ml-1 w-8' />
            </span>{' '}
            this year! You can make them via{' '}
            <a
              className='link'
              href='https://media.rauno.eu/' // TODO: Make configurable
              target='_blank'
              rel='noopener noreferrer'
            >
              media.rauno.eu
            </a>
          </p>
        </CardText>
      )}

      <CardText renderDelay={5} noScale={requestTotals.total == 0}>
        <p>
          Altogether there have been{' '}
          <span className='rewind-stat'>{requestTotals.total}</span>{' '}
          <span className='inline-flex items-center text-teal-300'>
            Requests
            <QuestionMarkCircleIcon className='ml-1 w-8' />
          </span>{' '}
          this year.
        </p>
      </CardText>

      {requestTotals.total != 0 && (
        <CardText renderDelay={10} loaderDelay={5} noScale>
          <p>That includes:</p>
          <ul className='list'>
            <StatListItem
              count={requestTotals.movies}
              name='Movies'
              icon={<FilmIcon className='ml-1 w-8' />}
              separator='for'
            />
            <StatListItem
              count={requestTotals.shows}
              name='Shows'
              icon={<PlayCircleIcon className='ml-1 w-8' />}
              separator='for'
            />
          </ul>
        </CardText>
      )}
    </Card>
  )
}
