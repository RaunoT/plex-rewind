import MediaItems from '@/components/MediaItem/MediaItems'
import { TautulliItemRow } from '@/types'
import {
  FilmIcon,
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
      <div>
        <div className='flex items-center'>
          <span>
            {type === 'movie' ? (
              <FilmIcon className='mr-2 size-16 stroke-1 text-black' />
            ) : type === 'show' ? (
              <PlayCircleIcon className='mr-2 size-16 stroke-1 text-black' />
            ) : type === 'artist' ? (
              <MusicalNoteIcon className='mr-2 size-16 stroke-1 text-black' />
            ) : (
              type === 'users' && (
                <UserIcon className='mr-2 size-16 stroke-1 text-black' />
              )
            )}
          </span>
          <div>
            <h2 className='flex items-center text-sm font-bold text-black sm:text-xl lg:text-2xl 2xl:text-3xl'>
              <span>{title}</span>
            </h2>
            <div className='font-medium text-black'>
              {totalSize && (
                <>
                  <span>{totalSize}</span>
                  <span className='mx-1 sm:mx-2' aria-hidden>
                    -
                  </span>
                </>
              )}
              {count && (
                <>
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
                </>
              )}
              <span className='mx-1 sm:mx-2' aria-hidden>
                -
              </span>
              {totalDuration && (
                <>
                  <span className='normal-case'>{totalDuration} played</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

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
