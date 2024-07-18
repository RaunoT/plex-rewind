import MediaItems from '@/components/MediaItem/MediaItems'
import { Settings, TautulliItemRow } from '@/types'
import {
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

type Props = {
  title: string
  items?: TautulliItemRow[]
  totalDuration?: string
  totalSize?: string | null
  type?: string
  serverId?: string
  count?: string
  settings: Settings
}

export default function Dashboard({
  title,
  items,
  totalDuration,
  totalSize,
  type = '',
  serverId = '',
  count,
  settings,
}: Props) {
  return (
    <>
      <h2 className='mb-1 flex items-center text-xl font-bold sm:text-2xl xl:text-3xl'>
        {getTitleIcon(type)}
        {title}
      </h2>
      <ul className='icon-stats-container mb-1 gap-3'>
        {totalSize && (
          <li className='icon-stat-wrapper icon-stat-wrapper--clean'>
            <FolderIcon />
            {totalSize}
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
                      : 'users'}
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
  const className = 'mr-1 sm:mr-2 size-8 sm:size-10 stroke-1 text-black'

  switch (type) {
    case 'movie':
      return <FilmIcon className={className} />
    case 'show':
      return <PlayCircleIcon className={className} />
    case 'artist':
      return <MusicalNoteIcon className={className} />
    default:
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
    default:
      return <UserIcon />
  }
}
