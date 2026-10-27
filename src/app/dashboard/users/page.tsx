import { canViewStats } from '@/lib/access'
import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { fetchOverseerrStats } from '@/utils/fetchOverseerr'
import { secondsToTime, TranslateFunction } from '@/utils/formatting'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import { toPublicSettings } from '@/utils/publicSettings'
import {
  getLibraries,
  getStatsSource,
  getUsersCount,
} from '@/utils/statsSource'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode, Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'
import DashboardToolbar from '../_components/DashboardToolbar'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Dashboard')

  return {
    title: t('usersTitle'),
  }
}

async function getTotalDuration(
  period: string,
  settings: Settings,
  t: TranslateFunction,
) {
  if (settings.dashboard.activeTotalStatistics.includes('duration')) {
    // The same libraries as each user's watch time
    const totalDuration = await getStatsSource(settings).getTotalDuration({
      since: period,
      libraries: await getLibraries(),
    })

    return secondsToTime(totalDuration, t)
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

    return requests?.length.toLocaleString(await getLocale())
  }

  return undefined
}

async function DashboardUsersContent({
  periodSp,
  toolbar,
}: {
  periodSp: DashboardSearchParams['period']
  toolbar: ReactNode
}) {
  const settings = getSettings()
  const t = await getTranslations()
  const session = await getServerSession(authOptions)

  if (
    !settings.dashboard.isActive ||
    !settings.dashboard.isUsersPageActive ||
    !canViewStats(settings, session)
  ) {
    return notFound()
  }

  const loggedInUserId = session?.user.id
  const period = getPeriod(periodSp, settings)
  const [usersData, totalDuration, usersCount, totalRequests] =
    await Promise.all([
      getUsersTop(loggedInUserId ?? '', period.string, period.daysAgo),
      getTotalDuration(period.string, settings, t),
      getUsersCount(settings),
      // The same start as each user's request count
      getTotalRequests(period.string, settings),
    ])

  return (
    <Dashboard
      items={usersData}
      totalDuration={totalDuration}
      totalSize={usersCount}
      type='users'
      settings={toPublicSettings(settings)}
      count={totalRequests}
      loggedInUserId={loggedInUserId}
      toolbar={toolbar}
    />
  )
}

type Props = {
  searchParams: Promise<DashboardSearchParams>
}

export default async function DashboardUsersPage({ searchParams }: Props) {
  const { period } = await searchParams
  const toolbar = (
    <DashboardToolbar settings={toPublicSettings(getSettings())} isUsers />
  )

  return (
    <Suspense
      fallback={
        <DashboardLoader
          toolbar={toolbar}
          type='users'
          activeStats={getSettings().dashboard.activeItemStatistics}
        />
      }
      key={period}
    >
      <DashboardUsersContent periodSp={period} toolbar={toolbar} />
    </Suspense>
  )
}
