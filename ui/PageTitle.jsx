'use client'

import { ArrowLeftIcon } from '@heroicons/react/24/solid'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

export default function PageTitle({ title }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')

  return (
    <div className="w-full mb-2">
      <div className="relative text-center uppercase">
        <Link
          href="/"
          className={clsx('w-5 block ml-5', {
            'absolute my-auto -translate-y-1/2 left-0 top-1/2': title,
          })}
        >
          <ArrowLeftIcon />
        </Link>
        {title && <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>}
      </div>
      <ul className="flex items-center justify-center gap-4 mt-3 text-xs font-medium sm:text-base">
        <li>
          <Link
            href={`${pathname}?period=7days`}
            className="text-white uppercase aria-selected:text-teal-300"
            aria-selected={period === '7days'}
          >
            7 days
          </Link>
        </li>
        <li>
          <Link
            href={`${pathname}?period=30days`}
            className="text-white uppercase aria-selected:text-teal-300"
            aria-selected={period === '30days'}
          >
            30 days
          </Link>
        </li>
        <li>
          <Link
            href={`${pathname}?period=thisYear`}
            className="text-white uppercase aria-selected:text-teal-300"
            aria-selected={period === 'thisYear'}
          >
            This year
          </Link>
        </li>
        <li>
          <Link
            href={`${pathname}?period=allTime`}
            className="text-white uppercase aria-selected:text-teal-300"
            aria-selected={period === 'allTime'}
          >
            All time
          </Link>
        </li>
      </ul>
    </div>
  )
}
