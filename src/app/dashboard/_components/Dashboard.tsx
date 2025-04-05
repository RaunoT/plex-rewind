import MediaItems from '@/components/MediaItem/MediaItems'
import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import {
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'
import DashboardFilters from './DashboardFilters'

type Props = {
  title: string
  items?: TautulliItemRow[] | null
  totalDuration?: string
  totalSize?: string | number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId?: string
  count?: string
  settings: Settings
  loggedInUserId?: string
}

export default async function Dashboard({
  title,
  items,
  totalDuration,
  totalSize,
  type,
  serverId = '',
  count,
  settings,
  loggedInUserId,
}: Props) {
  const isLoggedIn = !!loggedInUserId
  const t = await getTranslations('Dashboard')

  function renderFilters(className?: string) {
    if (type !== 'users') {
      return (
        <Suspense>
          <DashboardFilters
            className={className}
            isSortByPlaysActive={settings.dashboard.isSortByPlaysActive}
            personalFilter={isLoggedIn}
          />
        </Suspense>
      )
    }
  }

  return (
    <>
      <div className='mb-2 flex items-center justify-between gap-4 leading-tight'>
        <h2 className='flex items-center text-xl font-bold sm:-mt-1.5 sm:text-2xl xl:text-3xl'>
          {getTitleIcon(type)}
          {title}
        </h2>
        {renderFilters('hidden sm:flex')}
      </div>
      <ul className='icon-stats-container mb-1 sm:gap-x-3'>
        {totalSize && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {type === 'users' ? <UserIcon /> : <FolderIcon />}
            {totalSize}
            {type === 'users' && ` ${t('users')}`}
          </li>
        )}
        {count && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {getCountIcon(type)}
            <span>
              <span>{count}</span>&nbsp;
              <span>
                {type === 'movie'
                  ? t('movies')
                  : type === 'show'
                    ? t('episodes')
                    : type === 'artist'
                      ? t('tracks')
                      : t('requests')}
              </span>
            </span>
          </li>
        )}
        {totalDuration && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <ClockIcon />
            {totalDuration}
          </li>
        )}
      </ul>

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
          <h2 className='mb-4 py-32 text-2xl italic leading-tight last:mb-0 sm:text-3xl'>
            {t('noActivity')}
          </h2>
        </div>
      )}

      {renderFilters('flex sm:hidden justify-end pt-6')}
    </>
  )
}

function getTitleIcon(type: string) {
  const className =
    'mr-1 sm:mr-2 size-8 sm:size-10 stroke-1 text-black shrink-0 -ml-0.5 sm:-ml-1'

  switch (type) {
    case 'movie':
      return <FilmIcon className={className} />
    case 'show':
      return <PlayCircleIcon className={className} />
    case 'artist':
      return <MusicalNoteIcon className={className} />
    case 'users':
      return <UserIcon className={className} />
  }
}

function getCountIcon(type: string) {
  switch (type) {
    case 'movie':
      return <FilmIcon />
    case 'show':
      return <PlayCircleIcon />
    case 'artist':
      return <MusicalNoteIcon />
    case 'users':
      return <QuestionMarkCircleIcon />
  }
}
