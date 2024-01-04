import { DashboardParams } from '@/types'
import { PERIODS } from '@/utils/constants'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { getItems, getTotalDuration, getTotalSize } from '@/utils/getDashboard'
import { snakeCase } from 'lodash'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Dashboard from '../../_components/Dashboard'

export async function generateMetadata({
  params,
}: DashboardParams): Promise<Metadata> {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => snakeCase(library.section_name) === params.slug,
  )

  return {
    title: `${library?.section_name} | Plex Rewind Dashboard`,
  }
}

export async function generateStaticParams() {
  const libraries = await getLibraries()

  return libraries.map((library) => ({
    slug: snakeCase(library.section_name),
  }))
}

export default async function Page({ params, searchParams }: DashboardParams) {
  const libraries = await getLibraries()
  const library = libraries.find(
    (library) => snakeCase(library.section_name) === params.slug,
  )

  // TODO: not redirecting to parent 404 boundary
  if (!library || !library.is_active) {
    return notFound()
  }

  const periodSearchParams = searchParams?.period
  const periodKey =
    periodSearchParams && PERIODS[periodSearchParams]
      ? periodSearchParams
      : '30days'
  const period = PERIODS[periodKey]
  const [items, totalDuration, totalSize, serverId] = await Promise.all([
    getItems(library, period.daysAgo),
    getTotalDuration(library, period.string),
    getTotalSize(library),
    getServerId(),
  ])
  const libraryIndex = libraries.findIndex((lib) => lib === library)
  const prevCard =
    libraryIndex > 0
      ? `/dashboard/${snakeCase(libraries[libraryIndex - 1].section_name)}`
      : undefined
  const nextCard =
    libraryIndex >= 0 && libraryIndex < libraries.length - 1
      ? `/dashboard/${snakeCase(libraries[libraryIndex + 1].section_name)}`
      : '/dashboard/users'

  return (
    <Dashboard
      title={library.section_name}
      items={items}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard={prevCard}
      nextCard={nextCard}
      page={`${libraryIndex + 1} / ${libraries.length + 1}`}
      type={library.section_type}
      serverId={serverId}
      count={
        library.section_type === 'movie'
          ? Number(library.count).toLocaleString('en-US')
          : Number(library.child_count).toLocaleString('en-US')
      }
      periodQuery={
        periodSearchParams ? `?period=${periodSearchParams}` : undefined
      }
    />
  )
}
