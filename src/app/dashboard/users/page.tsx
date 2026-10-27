import { canViewStats } from '@/lib/access'
import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { fetchOverseerrStats } from '@/utils/fetchOverseerr'
import { getUsersCount } from '@/utils/fetchTautulli'
import { secondsToTime, TranslateFunction } from '@/utils/formatting'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import { getTautulliTotalDuration } from '@/utils/getTautulliDuration'
import { getTracearrTotalDuration } from '@/utils/getTracearrStats'
import getUsersTop from '@/utils/getUsersTop'
import { isTracearrSource } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
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
    if (isTracearrSource(settings)) {
      return secondsToTime(await getTracearrTotalDuration({ since: period }), t)
    }

    return secondsToTime(
      await getTautulliTotalDuration({
        after: period,
        excludedUsers: settings.general.excludedUsers,
      }),
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
      getTotalRequests(period.date, settings),
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
