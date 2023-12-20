'use client'

import { TautulliItem } from '@/utils/fetchTautulli'
import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link.js'
import { usePathname, useSearchParams } from 'next/navigation.js'
import CardMediaItems from './CardMediaItems'

type Props = {
  children?: React.ReactNode
  title: string
  subtitle?: string | null
  page?: string
  prevCard?: string
  nextCard?: string
  items?: TautulliItem[]
  totalDuration?: string
  totalSize?: string | number
  type?: string
  serverId?: string
  count?: string
}

export default function Card({
  children,
  title,
  subtitle,
  page,
  prevCard,
  nextCard,
  items,
  totalDuration,
  totalSize,
  type = '',
  serverId = '',
  count,
}: Props) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isRewind = pathname.split('/')[1] === 'rewind'
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''

  return (
    <>
      <div className='flex items-center'>
        {isRewind && session?.user?.image && (
          <div className='relative mr-4 size-12'>
            <Image
              src={session?.user?.image}
              alt={`${session?.user?.name} profile picture`}
              className='rounded-full object-cover'
              sizes='10rem'
              fill
              priority
            />
          </div>
        )}
        <div>
          <h2 className='flex items-center text-sm font-bold uppercase text-black sm:text-xl'>
            <span>{title}</span>
            {totalSize && (
              <>
                <span className='mx-1 sm:mx-2' aria-hidden>
                  -
                </span>
                <span>{totalSize}</span>
              </>
            )}
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
                      : 'tracks'}
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

          {subtitle && (
            <div className='text-xs font-medium uppercase text-slate-900 sm:text-sm'>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {isRewind ? (
        <ul className='flex flex-1 flex-col pt-12 sm:justify-center sm:pt-4'>
          {children}
        </ul>
      ) : (
        children
      )}

      {items?.length ? (
        <CardMediaItems items={items} type={type} serverId={serverId} />
      ) : (
        !isRewind && (
          <div className='flex flex-1 flex-col justify-center text-center text-neutral-300'>
            <h2 className='mb-4 py-32 text-2xl italic leading-tight last:mb-0 sm:text-3xl'>
              No activity during this period.. 😴
            </h2>
          </div>
        )
      )}

      <div className='mt-auto flex items-center justify-between pt-6 text-sm'>
        <div className='flex-1'>
          {prevCard && (
            <Link
              href={prevCard + period}
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
              href={nextCard + period}
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
