import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import StatListItem from '../../../ui/StatListItem'
import { CURRENT_YEAR } from '../../../utils/constants'
import fetchOverseerr, {
  fetchOverseerrUserId,
} from '../../../utils/fetchOverseerr'

async function getRequestsTotals() {
  let currentPage = 1
  let totalPages = 1
  let reqUrl = `request`
  let requests = []

  do {
    const requestsData = await fetchOverseerr(reqUrl)
    const requestsDataFiltered = requestsData.results.filter(
      (request) => Date.parse(request.createdAt) > Date.parse(CURRENT_YEAR),
    )
    requests = [...requestsDataFiltered, ...requests]
    totalPages = requestsData.pageInfo.pages
    currentPage = requestsData.pageInfo.page
    reqUrl = `request?skip=${requestsData.pageInfo.pageSize * currentPage}`
  } while (currentPage < totalPages)

  return {
    total: requests.length,
    movies: requests.filter((request) => request.type === 'movie').length,
    shows: requests.filter((request) => request.type === 'tv').length,
  }
}

async function getUserRequestsTotal() {
  const userId = await fetchOverseerrUserId(8898770)
  let currentPage = 1
  let totalPages = 1
  let reqUrl = `user/${userId}/requests`
  let userRequestsTotal = 0

  do {
    const userRequestsData = await fetchOverseerr(reqUrl)
    const userRequestsDataFiltered = userRequestsData.results.filter(
      (request) => Date.parse(request.createdAt) > Date.parse(CURRENT_YEAR),
    )
    userRequestsTotal += userRequestsDataFiltered.length
    totalPages = userRequestsData.pageInfo.pages
    currentPage = userRequestsData.pageInfo.page
    reqUrl = `user/${userId}/requests?skip=${
      userRequestsData.pageInfo.pageSize * currentPage
    }`
  } while (currentPage < totalPages)

  return userRequestsTotal
}

export default async function Requests() {
  return (
    <CardContent
      title="Requests"
      page="2 / 5"
      prevCard="/rewind/total"
      nextCard="/rewind/shows"
      subtitle="Rauno T"
      rewind
    >
      <Suspense fallback={<CardTextSkeleton />}>
        <Stats promises={[getRequestsTotals(), getUserRequestsTotal()]} />
      </Suspense>
    </CardContent>
  )
}

async function Stats({ promises }) {
  const [requestTotals, userRequestsTotal] = await Promise.all(promises)

  return (
    <>
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
    </>
  )
}
