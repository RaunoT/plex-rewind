'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { DashboardSearchParams } from '@/types/dashboard'
import { Settings } from '@/types/settings'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('PeriodSelectContent')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    dashboard: { setPeriod },
  } = useContext(GlobalContext)
  const periodParam = searchParams.get('period')
  const customPeriod = parseInt(settings.dashboard.customPeriod)
  const periodOptions = [
    { label: t('7days'), value: '7days' },
    {
      label: customPeriod > 1 ? `${customPeriod} ${t('days')}` : t('today'),
      value: 'custom',
    },
    { label: t('pastYear'), value: 'pastYear' },
    { label: t('allTime'), value: 'allTime' },
  ]
  const validPeriodValues = periodOptions.map((option) => option.value)
  const isValidPeriod = periodParam && validPeriodValues.includes(periodParam)
  const isDefaultSelected = !isValidPeriod

  // Sort period options by value
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

  useEffect(() => {
    setPeriod(
      isValidPeriod
        ? (periodParam as DashboardSearchParams['period'])
        : undefined,
    )
  }, [periodParam, setPeriod, isValidPeriod])

  return (
    <ul className='nav' aria-label={t('label')}>
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
