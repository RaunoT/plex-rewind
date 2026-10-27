import CardWrapper from '@/app/_components/CardWrapper'
import { MediaIcon, STAT_ICONS } from '@/components/icons'
import MediaItems from '@/components/MediaItem/MediaItems'
import { PublicSettings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import { getTranslations } from 'next-intl/server'
import { ReactNode } from 'react'
import DashboardHeader from './DashboardHeader'

type Props = {
  items?: TautulliItemRow[] | null
  totalDuration?: string
  totalRequests?: number
  totalSize?: string | number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId?: string
  count?: string
  settings: PublicSettings
  loggedInUserId?: string
  toolbar: ReactNode
}

export default async function Dashboard({
  items,
  totalDuration,
  totalRequests,
  totalSize,
  type,
  serverId = '',
  count,
  settings,
  loggedInUserId,
  toolbar,
}: Props) {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const countNumber = count ? Number(count.replace(/\D/g, '')) : 0

  return (
    <>
      <DashboardHeader
        periodStats={
          <>
            {!!totalDuration && (
              <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
                <STAT_ICONS.duration />
                {t(type === 'artist' ? 'durationListened' : 'durationWatched', {
                  duration: totalDuration,
                })}
              </li>
            )}
            {totalRequests !== undefined && (
              <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
                <STAT_ICONS.requests />
                {t('requests', { count: totalRequests })}
              </li>
            )}
          </>
        }
        toolbar={toolbar}
      />

      <CardWrapper>
        {items?.length ? (
          <MediaItems
            items={items}
            type={type}
            serverId={serverId}
            settings={settings}
            loggedInUserId={loggedInUserId}
          />
        ) : (
          <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
            <p className='py-24 text-2xl leading-tight sm:text-3xl'>
              {t('noActivity')}
            </p>
          </div>
        )}
      </CardWrapper>

      <ul className='icon-stats-container mt-4 justify-center gap-x-3 text-neutral-300 empty:hidden'>
        {!!totalSize && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {type === 'users' ? (
              <>
                <STAT_ICONS.users />
                {t('users', { count: Number(totalSize) })}
              </>
            ) : (
              <>
                <STAT_ICONS.size />
                <span className='sr-only'>{tCommon('size')}</span> {totalSize}
              </>
            )}
          </li>
        )}
        {count && type !== 'users' && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <MediaIcon type={type} />
            <span>
              <span>{count}</span>&nbsp;
              <span>
                {type === 'movie'
                  ? t('movies', { count: countNumber })
                  : type === 'show'
                    ? t('episodes', { count: countNumber })
                    : t('tracks', { count: countNumber })}
              </span>
            </span>
          </li>
        )}
      </ul>
    </>
  )
}
