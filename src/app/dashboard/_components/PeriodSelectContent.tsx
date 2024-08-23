'use client'

import { GlobalContext } from '@/app/_components/AppProvider'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { pluralize } from '@/utils/formatting'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useContext, useEffect } from 'react'

type Props = {
  settings: Settings
}

function getPeriodValue(period: string, customPeriod: number): number {
  switch (period) {
    case '7days':
      return 7
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
  const { setPeriod } = useContext(GlobalContext)
  const periodParam = searchParams.get('period')
  const customPeriod = parseInt(settings.dashboard.customPeriod)
  // Replace '30 days' with custom period if it exists
  const periodOptions = [
    { label: '7 days', value: '7days' },
    {
      label: `${pluralize(customPeriod, 'day')}`,
      value: 'custom',
    },
    { label: 'Past year', value: 'pastYear' },
    { label: 'All time', value: 'allTime' },
  ]
  const isDefaultSelected =
    !periodParam ||
    !periodOptions.some((option) => option.value === periodParam)

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
        const isDefault = value === 'custom'

        return (
          <li key={value}>
            <Link
              href={`${pathname}${getUpdatedQueryParams(isDefault ? '' : value)}`}
              className='nav-link'
              aria-selected={
                isDefault ? isDefaultSelected : periodParam === value
              }
              onClick={() =>
                setPeriod(
                  isDefault
                    ? undefined
                    : (value as DashboardSearchParams['period']),
                )
              }
            >
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
