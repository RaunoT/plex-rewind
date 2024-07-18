'use client'

import { Settings } from '@/types'
import { pluralize } from '@/utils/formatting'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  settings: Settings
}

export default function PeriodSelectContent({ settings }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
  const customPeriod = parseInt(settings.features.dashboardDefaultPeriod)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ul className='nav'>
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
          {customPeriod ? `${pluralize(customPeriod, 'day')}` : '30 days'}
        </Link>
      </li>
      <li>
        <Link
          href={`${pathname}?period=pastYear`}
          className='nav-link'
          aria-selected={period === 'pastYear'}
        >
          Past year
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
