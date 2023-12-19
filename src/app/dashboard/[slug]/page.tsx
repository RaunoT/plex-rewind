import Card from '@/components/Card/Card'
import { ALLOWED_PERIODS, metaDescription } from '@/utils/constants'
import { getLibraries, getServerId } from '@/utils/fetchTautulli'
import { getItems, getTotalDuration, getTotalSize } from '@/utils/getDashboard'
import { DashboardParams } from '@/utils/types'
import { snakeCase } from 'lodash'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  // TODO: add library name instead of generic dashboard
  title: 'Dashboard | Plex rewind dashboard',
  description: metaDescription,
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

  const periodKey =
    searchParams.period && ALLOWED_PERIODS[searchParams.period]
      ? searchParams.period
      : '30days'
  const period = ALLOWED_PERIODS[periodKey]
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
    <Card
      title={library.section_name}
      items={items}
      totalDuration={totalDuration}
      totalSize={totalSize}
      prevCard={prevCard}
      nextCard={nextCard}
      page={`${libraryIndex + 1} / ${libraries.length + 1}`}
      type={library.section_type}
      serverId={serverId}
    />
  )
}
