import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import CardContent from '../../../ui/CardContent'
import CardContentText from '../../../ui/CardContentText'
import StatListItem from '../../../ui/StatListItem'
import { ALLOWED_PERIODS } from '../../../utils/constants'
import {
  fetchPaginatedOverseerrStats,
  fetchUser,
} from '../../../utils/fetchOverseerr'

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
    <CardContent
      title="Requests"
      page="2 / 5"
      prevCard="/rewind/total"
      nextCard="/rewind/shows"
      subtitle={user.plexUsername}
    >
      {userRequestsTotal != 0 ? (
        <CardContentText hideAfter={requestTotals.total != 0 ? 10 : 0}>
          You&apos;ve made{' '}
          <span className="rewind-stat">{userRequestsTotal}</span> content{' '}
          <span className="inline-flex items-center text-teal-300">
            Requests
            <QuestionMarkCircleIcon className="w-8 ml-1" />
          </span>{' '}
          this year.
        </CardContentText>
      ) : (
        <CardContentText hideAfter={requestTotals.total != 0 ? 10 : 0}>
          You haven&apos;t made any content{' '}
          <span className="inline-flex items-center text-teal-300">
            Requests
            <QuestionMarkCircleIcon className="w-8 ml-1" />
          </span>{' '}
          this year! You can make them via{' '}
          <a
            className="link"
            href="https://media.rauno.eu/"
            target="_blank"
            rel="noreferrer"
          >
            media.rauno.eu
          </a>
        </CardContentText>
      )}

      <CardContentText renderDelay={5} noScale={requestTotals.total == 0}>
        Altogether there have been{' '}
        <span className="rewind-stat">{requestTotals.total}</span>{' '}
        <span className="inline-flex items-center text-teal-300">
          Requests
          <QuestionMarkCircleIcon className="w-8 ml-1" />
        </span>{' '}
        this year.
      </CardContentText>

      {requestTotals.total != 0 && (
        <CardContentText renderDelay={10} loaderDelay={5} noScale>
          That includes:
          <ul className="list">
            <StatListItem
              count={requestTotals.movies}
              name="Movies"
              icon={<FilmIcon className="w-8 ml-1" />}
              separator="for"
            />
            <StatListItem
              count={requestTotals.shows}
              name="Shows"
              icon={<PlayCircleIcon className="w-8 ml-1" />}
              separator="for"
            />
          </ul>
        </CardContentText>
      )}
    </CardContent>
  )
}
