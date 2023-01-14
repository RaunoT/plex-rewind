'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function PeriodSelect() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')

  return (
    <ul className="flex items-center justify-center gap-4 mb-2 -mt-2 text-xs font-medium sm:text-base">
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
          href={`${pathname}`}
          className="text-white uppercase aria-selected:text-teal-300"
          aria-selected={!period}
          disabled
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
  )
}
