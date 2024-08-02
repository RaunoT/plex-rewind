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
import { Suspense } from 'react'
import DashboardPersonalToggle from './DashboardPersonalToggle'

type Props = {
  title: string
  items?: TautulliItemRow[]
  totalDuration?: string
  totalSize?: string | number
  type: 'movie' | 'show' | 'artist' | 'users'
  serverId?: string
  count?: string
  settings: Settings
  isLoggedIn: boolean
}

export default function Dashboard({
  title,
  items,
  totalDuration,
  totalSize,
  type,
  serverId = '',
  count,
  settings,
  isLoggedIn,
}: Props) {
  return (
    <>
      <div className='mb-2 flex items-start justify-between gap-4 leading-tight'>
        <h2 className='-mt-0.5 flex text-xl font-bold sm:-mt-1.5 sm:text-2xl xl:text-3xl'>
          {getTitleIcon(type)}
          {title}
        </h2>
        {type !== 'users' && isLoggedIn && (
          <Suspense>
            <DashboardPersonalToggle />
          </Suspense>
        )}
      </div>
      <ul className='icon-stats-container mb-1 sm:gap-x-3'>
        {totalSize && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {type === 'users' ? <UserIcon /> : <FolderIcon />}
            {totalSize}
            {type === 'users' && ' users'}
          </li>
        )}
        {count && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            {getCountIcon(type)}
            <span>
              <span>{count}</span>&nbsp;
              <span>
                {type === 'movie'
                  ? 'movies'
                  : type === 'show'
                    ? 'episodes'
                    : type === 'artist'
                      ? 'tracks'
                      : 'requests'}
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
        />
      ) : (
        <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
          <h2 className='mb-4 py-32 text-2xl italic leading-tight last:mb-0 sm:text-3xl'>
            No activity during this period.. 😴
          </h2>
        </div>
      )}
    </>
  )
}

function getTitleIcon(type: string) {
  const className =
    'mr-1 sm:mr-2 size-8 sm:size-10 stroke-1 text-black shrink-0 pb-1 -ml-1'

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
