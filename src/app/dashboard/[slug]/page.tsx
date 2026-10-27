import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import {
  getItems,
  getItemsLimit,
  getNextItemsLimit,
  getTotalDuration,
  getTotalRequests,
  getTotalSize,
} from '@/utils/getDashboard'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import { canViewFeature, getViewer } from '@/utils/helpers'
import { toPublicSettings } from '@/utils/publicSettings'
import { getLibraries, getServerId } from '@/utils/statsSource'
import { kebabCase } from 'lodash'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode, Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'
import DashboardToolbar from '../_components/DashboardToolbar'

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    slug: string
  }>
}): Promise<Metadata> {
  const { slug } = await params
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === slug,
  )

  return {
    title: library?.section_name,
  }
}

async function DashboardContent({
  slug,
  periodSp,
  personalSp,
  sortBySp,
  limit,
  toolbar,
}: {
  slug: string
  periodSp: DashboardSearchParams['period']
  personalSp: DashboardSearchParams['personal']
  sortBySp: DashboardSearchParams['sortBy']
  limit: number
  toolbar: ReactNode
}) {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === slug,
  )
  const settings = getSettings()

  if (!library || !library.is_active) {
    return notFound()
  }

  const session = await getServerSession(authOptions)

  if (!canViewFeature(settings, 'dashboard', getViewer(session))) {
    return notFound()
  }

  const loggedInUserId = session?.user.id
  const period = getPeriod(periodSp, settings)
  const personalUserId = personalSp === 'true' ? loggedInUserId : undefined
  // Plays rank by default; the sort filter can switch to watch time
  const sortByPlays = sortBySp !== 'duration'
  const [
    { items, hasMore },
    totalDuration,
    totalRequests,
    totalSize,
    serverId,
  ] = await Promise.all([
    getItems(library, {
      period: period.daysAgo,
      userId: personalUserId,
      sortByPlays,
      count: limit,
    }),
    getTotalDuration(library, period.string, settings, personalUserId),
    getTotalRequests(period.string, settings, library, personalUserId),
    getTotalSize(library, settings),
    getServerId(),
  ])
  const isCountActive =
    settings.dashboard.activeTotalStatistics.includes('count')
  const countValue =
    library.section_type === 'movie'
      ? Number(library.count)
      : Number(library.child_count)
  const locale = await getLocale()
  const count = isCountActive ? countValue.toLocaleString(locale) : undefined

  return (
    <Dashboard
      items={items}
      totalDuration={totalDuration}
      totalRequests={totalRequests}
      totalSize={totalSize}
      type={library.section_type}
      serverId={serverId}
      count={count}
      settings={toPublicSettings(settings)}
      loggedInUserId={loggedInUserId}
      toolbar={toolbar}
      nextLimit={getNextItemsLimit(limit, hasMore)}
    />
  )
}

type Props = {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<DashboardSearchParams>
}

export default async function DashboardPage({ searchParams, params }: Props) {
  const { period, personal, sortBy, limit } = await searchParams
  const { slug } = await params
  const settings = getSettings()
  const session = await getServerSession(authOptions)
  // Already fetched by the layout, so this doesn't hold up the loader
  const library = (await getLibraries()).find(
    (library) => kebabCase(library.section_name) === slug,
  )
  const itemsLimit = getItemsLimit(limit)
  const publicSettings = toPublicSettings(settings)
  const toolbar = (
    <DashboardToolbar
      settings={publicSettings}
      personalFilter={!!session?.user.id}
    />
  )

  return (
    <Suspense
      fallback={
        <DashboardLoader
          toolbar={toolbar}
          type={library?.section_type ?? 'movie'}
          settings={publicSettings}
          rows={itemsLimit}
        />
      }
      // Without the limit, so "Show more" keeps the list up while it loads
      key={`period-${period}-personal-${personal}-sortBy-${sortBy}`}
    >
      <DashboardContent
        slug={slug}
        periodSp={period}
        personalSp={personal}
        sortBySp={sortBy}
        limit={itemsLimit}
        toolbar={toolbar}
      />
    </Suspense>
  )
}
