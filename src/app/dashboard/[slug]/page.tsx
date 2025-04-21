import { authOptions } from '@/lib/auth'
import { DashboardSearchParams } from '@/types/dashboard'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { getItems, getTotalDuration, getTotalSize } from '@/utils/getDashboard'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import { kebabCase } from 'lodash'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'

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
}: {
  slug: string
  periodSp: DashboardSearchParams['period']
  personalSp: DashboardSearchParams['personal']
  sortBySp: DashboardSearchParams['sortBy']
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
  const loggedInUserId = session?.user.id
  const period = getPeriod(periodSp, settings)
  const isPersonal = personalSp === 'true'
  const sortByPlays =
    sortBySp === 'plays' && settings.dashboard.isSortByPlaysActive
  const [items, totalDuration, totalSize, serverId] = await Promise.all([
    getItems(
      library,
      period.daysAgo,
      isPersonal && session?.user.id,
      sortByPlays,
    ),
    getTotalDuration(
      library,
      period.string,
      settings,
      isPersonal && session?.user.id,
    ),
    getTotalSize(library, settings),
    getServerId(),
  ])
  const isCountActive =
    settings.dashboard.activeTotalStatistics.includes('count')
  const countValue =
    library.section_type === 'movie'
      ? Number(library.count)
      : Number(library.child_count)
  const count = isCountActive ? countValue.toLocaleString('en-US') : undefined

  return (
    <Dashboard
      title={library.section_name}
      items={items}
      totalDuration={totalDuration}
      totalSize={totalSize}
      type={library.section_type}
      serverId={serverId}
      count={count}
      settings={settings}
      loggedInUserId={loggedInUserId}
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
  const { period, personal, sortBy } = await searchParams
  const { slug } = await params

  return (
    <Suspense
      fallback={<DashboardLoader />}
      key={`period-${period}-personal-${personal}-sortBy-${sortBy}`}
    >
      <DashboardContent
        slug={slug}
        periodSp={period}
        personalSp={personal}
        sortBySp={sortBy}
      />
    </Suspense>
  )
}
