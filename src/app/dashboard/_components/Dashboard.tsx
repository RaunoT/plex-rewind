import MediaItems from '@/components/MediaItem/MediaItems'
import { TautulliItemRow } from '@/types'
import {
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import {
  FilmIcon as FilmIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
  PlayCircleIcon as PlayCircleIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid'

type Props = {
  title: string
  items?: TautulliItemRow[]
  totalDuration?: string
  totalSize?: string | null
  type?: string
  serverId?: string
  count?: string
}

export default function Dashboard({
  title,
  items,
  totalDuration,
  totalSize,
  type = '',
  serverId = '',
  count,
}: Props) {
  return (
    <>
      <h2 className='mb-2 flex items-center font-bold text-black sm:text-xl xl:text-2xl'>
        {getTitleIcon(type)}
        {title}
      </h2>
      <ul className='flex flex-wrap items-center gap-2 text-xs font-medium text-black sm:gap-3 sm:text-sm lg:text-base'>
        {totalSize && (
          <li className='flex items-center'>
            <FolderIcon className='mr-1 size-5' />
            {totalSize}
          </li>
        )}
        {count && (
          <li className='flex items-center'>
            {getCountIcon(type)}
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
          </li>
        )}
        {totalDuration && (
          <li className='flex items-center'>
            <ClockIcon className='mr-1 size-5' />
            {totalDuration}
          </li>
        )}
      </ul>

      {items?.length ? (
        <MediaItems items={items} type={type} serverId={serverId} />
      ) : (
        <div className='flex flex-1 flex-col justify-center text-center text-neutral-200'>
          <h2 className='mb-4 py-32 text-2xl italic leading-tight last:mb-0 sm:text-3xl'>
            No activity during this period.. 😴
          </h2>
        </div>
      )}
    </>
  )
}

function getTitleIcon(type: string) {
  const className = 'mr-2 size-8 sm:size-10 stroke-1 text-black'

  switch (type) {
    case 'movie':
      return <FilmIconSolid className={className} />
    case 'show':
      return <PlayCircleIconSolid className={className} />
    case 'artist':
      return <MusicalNoteIconSolid className={className} />
    default:
      return <UserIconSolid className={className} />
  }
}

function getCountIcon(type: string) {
  const className = 'mr-1 size-5'

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
