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
  const { activeItemStatistics } = settings.general
  const periodStats = [
    activeTotalStatistics.includes('duration') && 'w-32',
    activeTotalStatistics.includes('requests') &&
      settings.connection.isOverseerrActive &&
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
        <ul className='flex flex-col overflow-hidden'>
          {[...Array(rows)].map((_, i) => (
            <ListItem key={i} type={type} activeStats={activeItemStatistics} />
          ))}
        </ul>
      </CardWrapper>

      <ul className='icon-stats-container mt-4 justify-center gap-x-3 empty:hidden'>
        <StatSkeletons widths={generalStats} />
      </ul>
    </div>
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
  const pills = [
    activeStats.includes('duration') && 'w-24',
    activeStats.includes('plays') && 'w-16',
    activeStats.includes('plays') && isUsers && 'w-16',
    activeStats.includes('users') && !isUsers && 'w-16',
  ].filter((width): width is string => !!width)

  return (
    <li className='flex items-start gap-3 py-2.5 not-first:border-t not-first:border-white/10 first:pt-0 last:pb-0 sm:gap-4'>
      <div className='flex shrink-0 items-center gap-3 sm:gap-4'>
        <div className='flex w-6 justify-center sm:w-8'>
          <div className='skeleton h-5 w-4 sm:h-6' />
        </div>
        <div className='skeleton poster' />
      </div>
      <div className='@container min-w-0 flex-1'>
        <div className='flex flex-col gap-2 @xl:flex-row @xl:items-start @xl:gap-4'>
          <div className='min-w-0 flex-1'>
            <SkeletonLine
              className='mb-0.5 sm:text-lg'
              width='w-2/3 sm:w-1/2'
            />
            {hasDetails && (
              <SkeletonLine className='mb-2 text-xs sm:text-sm' width='w-24' />
            )}
            <ul className='icon-stats-container'>
              {pills.map((width, i) => (
                <li key={i} className={clsx('skeleton h-5 sm:h-6', width)} />
              ))}
            </ul>
          </div>
          {!isUsers && (
            <div className='flex shrink-0 flex-wrap gap-x-1.5 gap-y-2.5 @xl:mt-0.5 @xl:flex-col @xl:items-end'>
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
