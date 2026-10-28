import CardWrapper from '@/app/_components/CardWrapper'
import SkeletonLine from '@/components/SkeletonLine'
import { ItemStatistics, PublicSettings } from '@/types/settings'
import { TautulliMediaType } from '@/types/tautulli'
import { DASHBOARD_PAGE_SIZE, RATING_STATISTICS } from '@/utils/constants'
import clsx from 'clsx'
import { ReactNode } from 'react'
import DashboardHeader from './DashboardHeader'

type Props = {
  toolbar: ReactNode
  type: TautulliMediaType | 'users'
  settings: PublicSettings
  rows?: number
}

// Built like the real rows for this library and the chosen statistics, so
// nothing moves once the data arrives
export default function DashboardLoader({
  toolbar,
  type,
  settings,
  rows = DASHBOARD_PAGE_SIZE,
}: Props) {
  const isUsers = type === 'users'
  const { activeTotalStatistics } = settings.dashboard
  const periodStats = [
    activeTotalStatistics.includes('duration') && 'w-32',
    activeTotalStatistics.includes('requests') &&
      settings.connection.isSeerrActive &&
      type !== 'artist' &&
      'w-20',
  ]
  const generalStats = isUsers
    ? [activeTotalStatistics.includes('count') && 'w-16']
    : [
        activeTotalStatistics.includes('size') && 'w-16',
        activeTotalStatistics.includes('count') && 'w-24',
      ]

  return (
    <div className='flex flex-1 flex-col'>
      <DashboardHeader
        periodStats={<StatSkeletons widths={periodStats} />}
        toolbar={toolbar}
      />

      <CardWrapper>
        <DashboardListSkeleton type={type} settings={settings} rows={rows} />
      </CardWrapper>

      <ul className='icon-stats-container mt-4 justify-center gap-x-3 empty:hidden'>
        <StatSkeletons widths={generalStats} />
      </ul>
    </div>
  )
}

// The rows alone, which also size the card for messages shown instead
export function DashboardListSkeleton({
  type,
  settings,
  rows = DASHBOARD_PAGE_SIZE,
}: Pick<Props, 'type' | 'settings' | 'rows'>) {
  return (
    <ul className='flex flex-col overflow-hidden'>
      {[...Array(rows)].map((_, i) => (
        <ListItem
          key={i}
          type={type}
          activeStats={settings.general.activeItemStatistics}
        />
      ))}
    </ul>
  )
}

function StatSkeletons({ widths }: { widths: (string | false)[] }) {
  return widths
    .filter((width): width is string => !!width)
    .map((width, i) => (
      <li key={i} className='icon-stat-wrapper icon-stat-wrapper--clean'>
        <div className='skeleton size-4' />
        <SkeletonLine width={width} />
      </li>
    ))
}

function ListItem({
  type,
  activeStats,
}: {
  type: Props['type']
  activeStats: ItemStatistics
}) {
  const isUsers = type === 'users'
  // Users have the date of their first play there
  const hasDetails =
    isUsers ||
    ((type === 'movie' || type === 'show') &&
      (activeStats.includes('year') ||
        RATING_STATISTICS.some((rating) => activeStats.includes(rating))))
  // Two at most, which fit on one line on the narrowest phones too
  const pills = [
    activeStats.includes('duration') && 'w-24',
    activeStats.includes('plays') && 'w-16',
    activeStats.includes('plays') && isUsers && 'w-16',
    activeStats.includes('users') && !isUsers && 'w-16',
  ]
    .filter((width): width is string => !!width)
    .slice(0, 2)

  return (
    <li className='flex items-center gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 max-sm:flex-wrap sm:gap-4'>
      <div className='flex shrink-0 items-center gap-3 max-sm:pt-1 max-sm:pl-1 sm:gap-4'>
        {/* Phones show the rank as a badge on the poster */}
        <div className='flex w-8 justify-center max-sm:hidden'>
          <div className='skeleton h-6 w-4' />
        </div>
        <div className='skeleton poster max-sm:w-12' />
      </div>
      <div className='@container min-w-0 flex-1 max-sm:contents'>
        <div className='flex flex-col gap-2 max-sm:contents @md:flex-row @md:items-start @md:gap-4'>
          <div className='min-w-0 flex-1'>
            <SkeletonLine
              className='mb-1.5 leading-snug sm:text-lg'
              width='w-2/3 sm:w-1/2'
            />
            {hasDetails && (
              <SkeletonLine className='mb-2 text-xs sm:text-sm' width='w-24' />
            )}
            {/* Pills from sm up, a line of text on phones */}
            <ul className='icon-stats-container max-sm:gap-x-2.5'>
              {pills.map((width, i) => (
                <li key={i} className={clsx('skeleton h-4 sm:h-6', width)} />
              ))}
            </ul>
          </div>
          {!isUsers && (
            <div className='flex shrink-0 flex-wrap gap-x-1.5 gap-y-2.5 max-sm:basis-full max-sm:*:flex-1 @md:mt-0.5 @md:max-w-56 @md:justify-end'>
              <div className='skeleton h-6 w-24 rounded-md' />
              {type !== 'artist' && (
                <div className='skeleton h-6 w-11 rounded-md' />
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
