'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PeriodSelect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')

  return (
    <ul className='flex items-center justify-center gap-4 mt-2 text-xs font-medium uppercase sm:text-sm'>
      {/* TODO: Don't allow hover on already selected items */}
      <li>
        <Link
          href={`${pathname}?period=7days`}
          className='transition aria-selected:text-teal-300 hover:opacity-75'
          aria-selected={period === '7days'}
        >
          7 days
        </Link>
      </li>
      <li>
        <Link
          href={`${pathname}`}
          className='transition aria-selected:text-teal-300 hover:opacity-75'
          aria-selected={!period}
        >
          30 days
        </Link>
      </li>
      <li>
        <Link
          href={`${pathname}?period=thisYear`}
          className='transition aria-selected:text-teal-300 hover:opacity-75'
          aria-selected={period === 'thisYear'}
        >
          This year
        </Link>
      </li>
      {/* TODO: Add previous year filter */}
      <li>
        <Link
          href={`${pathname}?period=allTime`}
          className='transition aria-selected:text-teal-300 hover:opacity-75'
          aria-selected={period === 'allTime'}
        >
          All time
        </Link>
      </li>
    </ul>
  )
}
