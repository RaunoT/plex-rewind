import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import CardContent from '../../../ui/CardContent'
import CardContentText from '../../../ui/CardContentText'
import StatListItem from '../../../ui/StatListItem'
import { CURRENT_YEAR } from '../../../utils/constants'
import {
  fetchOverseerrUserId,
  fetchPaginatedOverseerrStats,
} from '../../../utils/fetchOverseerr'

async function getRequestsTotals() {
  const requests = await fetchPaginatedOverseerrStats('request', CURRENT_YEAR)

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
  }
}

async function getUserRequestsTotal() {
  const userId = await fetchOverseerrUserId(8898770)
  const userRequestsTotal = await fetchPaginatedOverseerrStats(
    `user/${userId}/requests`,
    CURRENT_YEAR,
  )

  return userRequestsTotal.length
}

export default async function Requests() {
  const [requestTotals, userRequestsTotal] = await Promise.all([
    getRequestsTotals(),
    getUserRequestsTotal(),
  ])

  return (
    <CardContent
      title="Requests"
      page="2 / 5"
      prevCard="/rewind/total"
      nextCard="/rewind/shows"
      subtitle="Rauno T"
      rewind
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
