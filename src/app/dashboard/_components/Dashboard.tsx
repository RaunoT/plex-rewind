import CardWrapper from '@/app/_components/CardWrapper'
import MediaItems from '@/components/MediaItem/MediaItems'
import { PublicSettings } from '@/types/settings'
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
import { ReactNode } from 'react'

type Props = {
  items?: TautulliItemRow[] | null
  totalDuration?: string
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
      <div className='mb-4'>{toolbar}</div>

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

      <ul className='icon-stats-container mt-4 justify-center gap-x-3 text-neutral-300'>
        {!!totalSize && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {type === 'users' ? (
              <>
                <UserIcon />
                {t('users', { count: Number(totalSize) })}
              </>
            ) : (
              <>
                <FolderIcon />
                <span className='sr-only'>{tCommon('size')}</span> {totalSize}
              </>
            )}
          </li>
        )}
        {count && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {getCountIcon(type)}
            <span>
              <span>{count}</span>&nbsp;
              <span>
                {type === 'movie'
                  ? t('movies', { count: countNumber })
                  : type === 'show'
                    ? t('episodes', { count: countNumber })
                    : type === 'artist'
                      ? t('tracks', { count: countNumber })
                      : t('requests', { count: countNumber })}
              </span>
            </span>
          </li>
        )}
        {totalDuration && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <ClockIcon />
            <span className='sr-only'>{tCommon('duration')}</span>{' '}
            {totalDuration}
          </li>
        )}
      </ul>
    </>
  )
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
