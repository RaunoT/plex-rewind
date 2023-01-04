import {
  FilmIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'
import { Suspense } from 'react'
import CardContent from '../../../ui/CardContent'
import CardContentText, { CardTextSkeleton } from '../../../ui/CardContentText'
import StatListItem from '../../../ui/StatListItem'
import fetchOverseerr, {
  fetchOverseerrUserId,
} from '../../../utils/fetchOverseerr'

// FIXME: Only include data from this year
async function getRequestsTotals() {
  const requestTotals = await fetchOverseerr('request/count')

  return requestTotals
}

async function getUserRequestsTotal() {
  const userId = await fetchOverseerrUserId(8898770)
  const userRequestsTotal = await fetchOverseerr(`user/${userId}/requests`)

  return userRequestsTotal.pageInfo?.results
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
      <CardContentText hideAfter={10}>
        You&apos;ve made{' '}
        <span className="rewind-stat">{userRequestsTotal}</span> content{' '}
        <span className="inline-flex items-center text-teal-300">
          Requests
          <QuestionMarkCircleIcon className="w-8 ml-1" />
        </span>{' '}
        this year.
      </CardContentText>

      <CardContentText renderDelay={5}>
        Overall there have been{' '}
        <span className="rewind-stat">{requestTotals.total}</span>{' '}
        <span className="inline-flex items-center text-teal-300">
          Requests
          <QuestionMarkCircleIcon className="w-8 ml-1" />
        </span>{' '}
        this year.
      </CardContentText>

      <CardContentText renderDelay={10} loaderDelay={5} noScale>
        That includes:
        <ul className="list">
          <StatListItem
            count={requestTotals.movie}
            name="Movies"
            icon={<FilmIcon className="w-8 ml-1" />}
          />
          <StatListItem
            count={requestTotals.tv}
            name="Shows"
            icon={<PlayCircleIcon className="w-8 ml-1" />}
          />
        </ul>
      </CardContentText>
    </>
  )
}
