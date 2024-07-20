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
import DashboardLoader from '../_components/Loader'

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
  const settings = await getSettings()

  if (!library || !library.is_active) {
    return notFound()
  }

  const period = getPeriod(searchParams, settings)
  const [items, totalDuration, totalSize, serverId] = await Promise.all([
    getItems(library, period.daysAgo),
    getTotalDuration(library, period.string),
    getTotalSize(library),
    getServerId(),
  ])

  return (
    <Dashboard
      title={library.section_name}
      items={items}
      totalDuration={totalDuration}
      totalSize={totalSize}
      type={library.section_type}
      serverId={serverId}
      count={
        library.section_type === 'movie'
          ? Number(library.count).toLocaleString('en-US')
          : Number(library.child_count).toLocaleString('en-US')
      }
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
