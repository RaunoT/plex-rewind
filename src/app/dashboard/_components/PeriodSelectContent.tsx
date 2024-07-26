'use client'

import { Settings } from '@/types'
import { getPeriodValue, pluralize } from '@/utils/formatting'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  settings: Settings
}

const DEFAULT_PERIOD_OPTIONS = [
  { label: '7 days', value: '7days' },
  { label: '30 days', value: '30days' },
  { label: 'Past year', value: 'pastYear' },
  { label: 'All time', value: 'allTime' },
]

export default function PeriodSelectContent({ settings }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
  const customPeriod = parseInt(settings.features.dashboardCustomPeriod)
  // Replace '30 days' with custom period if it exists
  const periodOptions = customPeriod
    ? [
        { label: '7 days', value: '7days' },
        { label: `${pluralize(customPeriod, 'day')}`, value: `customPeriod` },
        { label: 'Past year', value: 'pastYear' },
        { label: 'All time', value: 'allTime' },
      ]
    : DEFAULT_PERIOD_OPTIONS

  // Sort period options
  periodOptions.sort((a, b) => {
    return (
      getPeriodValue(a.value, customPeriod) -
      getPeriodValue(b.value, customPeriod)
    )
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ul className='nav'>
      {periodOptions.map(({ label, value }) => (
        <li key={value}>
          <Link
            href={
              value === 'customPeriod'
                ? pathname
                : `${pathname}?period=${value}`
            }
            className='nav-link'
            aria-selected={
              value === 'customPeriod' ? !period : period === value
            }
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
