import { DashboardParams } from '@/types'
import { PERIODS } from '@/utils/constants'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { getItems, getTotalDuration, getTotalSize } from '@/utils/getDashboard'
import getSettings from '@/utils/getSettings'
import { kebabCase } from 'lodash'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Dashboard from '../_components/Dashboard'

export async function generateMetadata({
  params,
}: DashboardParams): Promise<Metadata> {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === params.slug,
  )

  return {
    title: library?.section_name,
  }
}

export default async function DashboardPage({
  params,
  searchParams,
}: DashboardParams) {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => kebabCase(library.section_name) === params.slug,
  )
  const settings = await getSettings()

  // TODO: not redirecting to parent 404 boundary
  if (!library || !library.is_active) {
    return notFound()
  }

  const periodSearchParams = searchParams?.period
  const customPeriod = parseInt(settings.features.dashboardDefaultPeriod)
  let period = PERIODS['30days']

  if (periodSearchParams && PERIODS[periodSearchParams]) {
    period = PERIODS[periodSearchParams]
  } else if (customPeriod) {
    const DAYS_AGO_CUSTOM: Date = new Date(
      new Date().setDate(new Date().getDate() - customPeriod),
    )
    period = {
      date: DAYS_AGO_CUSTOM.toISOString(),
      string: DAYS_AGO_CUSTOM.toISOString().split('T')[0],
      daysAgo: customPeriod,
    }
  }

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
