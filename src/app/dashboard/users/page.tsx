import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { fetchOverseerrStats } from '@/utils/fetchOverseerr'
import fetchTautulli, { getUsersCount } from '@/utils/fetchTautulli'
import {
  secondsToTime,
  timeToSeconds,
  TranslateFunction,
} from '@/utils/formatting'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'

export const metadata: Metadata = {
  title: 'Users',
}

async function getTotalDuration(
  period: string,
  settings: Settings,
  t: TranslateFunction,
) {
  if (settings.dashboard.activeTotalStatistics.includes('duration')) {
    const totalDuration = await fetchTautulli<{ total_duration: string }>(
      'get_history',
      {
        after: period,
        length: 0,
      },
    )

    return secondsToTime(
      timeToSeconds(totalDuration?.response?.data?.total_duration || '0'),
      t,
    )
  }

  return undefined
}

async function getTotalRequests(period: string, settings: Settings) {
  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey

  if (
    settings.dashboard.activeTotalStatistics.includes('requests') &&
    isOverseerrActive
  ) {
    const requests = await fetchOverseerrStats('request', period)

    return requests.length.toString()
  }

  return undefined
}

type Props = {
  searchParams: DashboardSearchParams
}

async function DashboardUsersContent({ searchParams }: Props) {
  const settings = getSettings()
  const t = await getTranslations()

  if (!settings.dashboard.isUsersPageActive) {
    return notFound()
  }

  const session = await getServerSession(authOptions)
  const loggedInUserId = session?.user.id
  const period = getPeriod(searchParams, settings)
  const [usersData, totalDuration, usersCount, totalRequests] =
    await Promise.all([
      getUsersTop(loggedInUserId, period.string, period.daysAgo),
      getTotalDuration(period.string, settings, t),
      getUsersCount(settings),
      getTotalRequests(period.date, settings),
    ])

  return (
    <Dashboard
      title='Users'
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      type='users'
      settings={settings}
      count={totalRequests}
      loggedInUserId={loggedInUserId}
    />
  )
}

export default function DashboardUsersPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardLoader />} key={searchParams.period}>
      <DashboardUsersContent searchParams={searchParams} />
    </Suspense>
  )
}
