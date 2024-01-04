import MediaItems from '@/components/MediaItem/MediaItems'
import { TautulliItemRow } from '@/types'
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link.js'

type Props = {
  title: string
  page?: string
  prevCard?: string
  nextCard?: string
  items?: TautulliItemRow[]
  totalDuration?: string
  totalSize?: string | null
  type?: string
  serverId?: string
  count?: string
  periodQuery?: string | undefined
}

export default function Dashboard({
  title,
  page,
  prevCard,
  nextCard,
  items,
  totalDuration,
  totalSize,
  type = '',
  serverId = '',
  count,
  periodQuery = '',
}: Props) {
  return (
    <>
      <div>
        <h2 className='flex items-center text-sm font-bold uppercase text-black sm:text-xl'>
          <span>{title}</span>
          {totalSize && <span>&nbsp;({totalSize})</span>}
          {count && (
            <>
              <span className='mx-1 sm:mx-2' aria-hidden>
                -
              </span>
              <span>{count}</span>&nbsp;
              <span>
                {type === 'movie'
                  ? 'movies'
                  : type === 'show'
                    ? 'episodes'
                    : type === 'artist' && 'tracks'}
              </span>
            </>
          )}
        </h2>
        <div className='text-xs font-medium uppercase text-slate-900 sm:text-sm'>
          {totalDuration && (
            <>
              Total plays
              <span className='mx-1 sm:mx-2' aria-hidden>
                -
              </span>
              <span className='normal-case'>{totalDuration}</span>
            </>
          )}
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

      <div className='mt-auto flex items-center justify-between pt-6 text-sm sm:pt-8'>
        <div className='flex-1'>
          {prevCard && (
            <Link
              href={prevCard + periodQuery}
              className='block w-5 transition-transform hover:translate-x-0.5 hover:opacity-75'
            >
              <ArrowLongLeftIcon className='text-teal-300' />
            </Link>
          )}
        </div>
        <span className='flex-1 text-center text-gray-400'>{page}</span>
        <div className='flex-1 text-right'>
          {nextCard && (
            <Link
              href={nextCard + periodQuery}
              className='ml-auto block w-5 transition-transform hover:-translate-x-0.5 hover:opacity-75'
            >
              <ArrowLongRightIcon className='text-teal-300' />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
