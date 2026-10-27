import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { secondsToTime, TranslateFunction } from '@/utils/formatting'
import {
  getItemsLimit,
  getNextItemsLimit,
  getTotalRequests,
} from '@/utils/getDashboard'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import getUsersTop from '@/utils/getUsersTop'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import {
  getLibraries,
  getStatsSource,
  getUsersCount,
} from '@/utils/statsSource'
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
    // The same libraries as each user's watch time
    const totalDuration = await getStatsSource(settings).getTotalDuration({
      since: period,
      libraries: await getLibraries(),
    })

    return secondsToTime(totalDuration, t)
  }

  return undefined
}

async function DashboardUsersContent({
  periodSp,
  limit,
  toolbar,
}: {
  periodSp: DashboardSearchParams['period']
  limit: number
  toolbar: ReactNode
}) {
  const settings = getSettings()
  const t = await getTranslations()
  const session = await getServerSession(authOptions)

  if (
    !settings.dashboard.isUsersPageActive ||
    !canViewFeature(settings, 'dashboard', getViewer(session))
  ) {
    return notFound()
  }

  const loggedInUserId = session?.user.id
  const period = getPeriod(periodSp, settings)
  const [usersData, totalDuration, usersCount, totalRequests] =
    await Promise.all([
      getUsersTop(loggedInUserId ?? '', period.string, period.daysAgo, limit),
      getTotalDuration(period.string, settings, t),
      getUsersCount(settings),
      // The same start as each user's request count
      getTotalRequests(period.string, settings),
    ])

  return (
    <Dashboard
      items={usersData?.items}
      totalDuration={totalDuration}
      totalRequests={totalRequests}
      totalSize={usersCount}
      type='users'
      settings={toPublicSettings(settings)}
      loggedInUserId={loggedInUserId}
      toolbar={toolbar}
      nextLimit={getNextItemsLimit(limit, !!usersData?.hasMore)}
    />
  )
}

type Props = {
  searchParams: Promise<DashboardSearchParams>
}

export default async function DashboardUsersPage({ searchParams }: Props) {
  const { period, limit } = await searchParams
  const itemsLimit = getItemsLimit(limit)
  const settings = toPublicSettings(getSettings())
  const toolbar = <DashboardToolbar settings={settings} isUsers />

  return (
    <Suspense
      fallback={
        <DashboardLoader
          toolbar={toolbar}
          type='users'
          settings={settings}
          rows={itemsLimit}
        />
      }
      // Without the limit, so "Show more" keeps the list up while it loads
      key={period}
    >
      <DashboardUsersContent
        periodSp={period}
        limit={itemsLimit}
        toolbar={toolbar}
      />
    </Suspense>
  )
}
