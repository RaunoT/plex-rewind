'use client'

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link.js'
import { usePathname, useSearchParams } from 'next/navigation.js'
import CardMediaItems from './CardMediaItems'

type Props = {
  children: React.ReactNode
  title: string
  subtitle?: string
  page?: string
  prevCard?: string
  nextCard?: string
  items?: MediaItem[]
  totalDuration?: string
  totalSize?: string
  type?: string
  serverId?: string
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
}: Props) {
  const pathname = usePathname()
  const isRewind = pathname.split('/')[1] === 'rewind'
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''

  return (
    <>
      <h2 className='mb-1 flex items-center text-sm font-bold uppercase text-black sm:text-xl'>
        <span>{title}</span>
        {totalSize && (
          <>
            <span className='mx-1 sm:mx-2' aria-hidden>
              -
            </span>
            <span>{totalSize}</span>
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
          {isRewind && (
            <>
              <span className='mx-1 sm:mx-2' aria-hidden>
                -
              </span>
              <span>Rewind {new Date().getFullYear()}</span>
            </>
          )}
        </div>
      )}

      {isRewind ? (
        <ul className='flex flex-1 flex-col pt-12 sm:justify-center sm:pb-12 sm:pt-4'>
          {children}
        </ul>
      ) : (
        children
      )}

      {items && (
        <CardMediaItems items={items} type={type} serverId={serverId} />
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
        <span className='flex-1 text-center'>{page}</span>
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
