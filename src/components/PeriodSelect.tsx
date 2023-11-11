'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PeriodSelect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')

  return (
    <ul className='mt-2 flex items-center justify-center gap-4 text-xs font-medium uppercase sm:text-sm'>
      <li>
        <Link
          href={`${pathname}?period=7days`}
          className='nav-link'
          aria-selected={period === '7days'}
        >
          7 days
        </Link>
      </li>
      <li>
        <Link href={`${pathname}`} className='nav-link' aria-selected={!period}>
          30 days
        </Link>
      </li>
      <li>
        <Link
          href={`${pathname}?period=thisYear`}
          className='nav-link'
          aria-selected={period === 'thisYear'}
        >
          This year
        </Link>
      </li>
      <li>
        <Link
          href={`${pathname}?period=allTime`}
          className='nav-link'
          aria-selected={period === 'allTime'}
        >
          All time
        </Link>
      </li>
    </ul>
  )
}
