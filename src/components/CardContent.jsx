'use client'

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link.js'
import { usePathname, useSearchParams } from 'next/navigation.js'
import CardContentItems from './CardContentItems.jsx'

export default function CardContent({
  children,
  title,
  subtitle,
  page,
  prevCard,
  nextCard,
  items,
  totalDuration,
  totalSize,
  type,
  usersPlays,
  userRequests,
  ratings,
  serverId = '',
}) {
  const pathname = usePathname()
  const isRewind = pathname.split('/')[1] === 'rewind'
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''

  return (
    <>
      <h2 className='flex items-center mb-1 text-sm font-bold text-black uppercase sm:text-xl'>
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

      <div className='text-xs font-medium uppercase sm:text-sm text-slate-900'>
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
        <div className='text-xs font-medium uppercase sm:text-sm text-slate-900'>
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
        <ul className='flex flex-col flex-1 pt-12 sm:justify-center sm:pb-12 sm:pt-4'>
          {children}
        </ul>
      ) : (
        children
      )}

      {items && (
        <CardContentItems
          items={items}
          usersPlays={usersPlays}
          type={type}
          userRequests={userRequests}
          ratings={ratings}
          serverId={serverId}
        />
      )}

      <div className='flex items-center justify-between pt-6 mt-auto text-sm'>
        <div className='flex-1'>
          {prevCard && (
            <Link
              href={prevCard + period}
              className='block w-5 transition-transform hover:opacity-75 hover:translate-x-0.5'
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
              className='block w-5 ml-auto transition-transform hover:opacity-75 hover:-translate-x-0.5'
            >
              <ArrowLongRightIcon className='text-teal-300' />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
