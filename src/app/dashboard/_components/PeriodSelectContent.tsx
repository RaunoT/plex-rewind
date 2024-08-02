'use client'

import { Settings } from '@/types/settings'
import { pluralize } from '@/utils/formatting'
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

function getPeriodValue(period: string, customPeriod: number): number {
  switch (period) {
    case '7days':
      return 7
    case '30days':
      return 30
    case 'pastYear':
      return 365
    case 'allTime':
      return Infinity
    case 'custom':
      return customPeriod
    default:
      return 0
  }
}

export default function PeriodSelectContent({ settings }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
  const customPeriod = parseInt(settings.dashboard.customPeriod)
  const defaultPeriod = settings.dashboard.defaultPeriod
  // Replace '30 days' with custom period if it exists
  const periodOptions = customPeriod
    ? [
        { label: '7 days', value: '7days' },
        {
          label: `${pluralize(customPeriod, 'day')}`,
          value: 'custom',
        },
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

  function getUpdatedQueryParams(newPeriod: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (newPeriod) {
      params.set('period', newPeriod)
    } else {
      params.delete('period')
    }

    return params.toString() ? `?${params.toString()}` : ''
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ul className='nav'>
      {periodOptions.map(({ label, value }) => {
        const isDefault = value === defaultPeriod

        return (
          <li key={value}>
            <Link
              href={`${pathname}${getUpdatedQueryParams(isDefault ? '' : value)}`}
              className='nav-link'
              aria-selected={isDefault ? !period : period === value}
            >
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
