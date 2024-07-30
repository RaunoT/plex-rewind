import { SearchParams } from '@/types'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { getItems, getTotalDuration, getTotalSize } from '@/utils/getDashboard'
import getPeriod from '@/utils/getPeriod'
import getSettings from '@/utils/getSettings'
import { kebabCase } from 'lodash'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Dashboard from '../_components/Dashboard'
import DashboardLoader from '../_components/DashboardLoader'

type Props = {
  params: {
    slug: string
  }
  searchParams: SearchParams
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

  const period = getPeriod(searchParams, settings)
  const [items, totalDuration, totalSize, serverId] = await Promise.all([
    getItems(library, period.daysAgo),
    getTotalDuration(library, period.string, settings),
    getTotalSize(library, settings),
    getServerId(),
  ])
  const isCountActive =
    settings.features.activeDashboardTotalStatistics.includes('count')
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
    />
  )
}

export default function DashboardPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<DashboardLoader />} key={searchParams.period}>
      <DashboardContent params={params} searchParams={searchParams} />
    </Suspense>
  )
}
