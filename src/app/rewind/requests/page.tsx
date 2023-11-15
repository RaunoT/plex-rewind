import Card from '@/components/Card'
import CardText from '@/components/CardText'
import StatListItem from '@/components/StatListItem'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import { fetchPaginatedOverseerrStats, fetchUser } from '@/utils/fetchOverseerr'
import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Metadata } from 'next'

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

async function getUserRequestsTotal() {
  // TODO: Get overseerr id
  const user = await fetchUser()
  const userRequestsTotal = await fetchPaginatedOverseerrStats(
    `user/${user.id}/requests`,
    ALLOWED_PERIODS.thisYear.date,
  )

  return userRequestsTotal.length
}

export default async function Requests() {
  const [requestTotals, userRequestsTotal, user] = await Promise.all([
    getRequestsTotals(),
    getUserRequestsTotal(),
    fetchUser(),
  ])

  return (
    <Card
      title='Requests'
      page='2 / 5'
      prevCard='/rewind/totals'
      nextCard='/rewind/shows'
      subtitle={user.plexUsername}
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
