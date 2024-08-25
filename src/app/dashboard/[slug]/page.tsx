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

type Props = {
  params: {
    slug: string
  }
  searchParams: DashboardSearchParams
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === params.slug,
  )

  return {
    title: library?.section_name,
  }
}

async function DashboardContent({ params, searchParams }: Props) {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === params.slug,
  )
  const settings = getSettings()

  if (!library || !library.is_active) {
    return notFound()
  }

  const session = await getServerSession(authOptions)
  const period = getPeriod(searchParams, settings)
  const isPersonal = searchParams.personal === 'true'
  const sortByPlays =
    searchParams.sortBy === 'plays' && settings.dashboard.isSortByPlaysActive
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
      isLoggedIn={!!session}
    />
  )
}

export default function DashboardPage({ params, searchParams }: Props) {
  return (
    <Suspense
      fallback={<DashboardLoader />}
      key={`period-${searchParams.period}-personal-${searchParams.personal}-sortBy-${searchParams.sortBy}`}
    >
      <DashboardContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}
