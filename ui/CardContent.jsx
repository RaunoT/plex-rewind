'use client'

import {
  ArrowLongLeftIcon,
  ArrowLongRightIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link.js'
import { useContext, useEffect } from 'react'
import { CardContext } from '../app/layout.js'
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
  rewind,
  usersPlays,
  userRequests,
}) {
  const { prevPageState, nextPageState } = useContext(CardContext)
  const [prevPage, setPrevPage] = prevPageState
  const [nextPage, setNextPage] = nextPageState

  useEffect(() => {
    setPrevPage(prevCard)
    setNextPage(nextCard)
  }, [prevCard, setPrevPage, nextCard, setNextPage])

  return (
    <>
      <h2 className="flex items-center mb-1 text-sm font-bold text-black uppercase sm:text-xl">
        <span>{title}</span>
        {totalSize && (
          <>
            <span className="mx-1 sm:mx-2" aria-hidden>
              -
            </span>
            <span>{totalSize}</span>
          </>
        )}
      </h2>

      <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
        {totalDuration && (
          <>
            Total plays
            <span className="mx-1 sm:mx-2" aria-hidden>
              -
            </span>
            <span className="normal-case">{totalDuration}</span>
          </>
        )}
      </div>

      {subtitle && (
        <div className="text-xs font-medium uppercase sm:text-sm text-slate-900">
          {subtitle}
          {rewind && (
            <>
              <span className="mx-1 sm:mx-2" aria-hidden>
                -
              </span>
              <span>Rewind {new Date().getFullYear()}</span>
            </>
          )}
        </div>
      )}

      {rewind ? (
        <ul className="flex flex-col flex-1 pt-12 sm:justify-center sm:pb-12 sm:pt-4">
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
        />
      )}

      <div className="flex items-center justify-between pt-5 mt-auto text-sm">
        <div className="flex-1">
          {prevPage && (
            <Link href={prevPage} className="block w-5">
              <ArrowLongLeftIcon className="text-teal-300" />
            </Link>
          )}
        </div>
        <span className="flex-1 text-center">{page}</span>
        <div className="flex-1 text-right">
          {nextPage && (
            <Link href={nextPage} className="block w-5 ml-auto">
              <ArrowLongRightIcon className="text-teal-300" />
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
