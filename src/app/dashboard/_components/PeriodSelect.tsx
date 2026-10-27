'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { DashboardSearchParams } from '@/types/dashboard'
import { PublicSettings } from '@/types/settings'
import { parseCustomPeriod } from '@/utils/getPeriod'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useContext, useEffect } from 'react'

type Props = {
  settings: PublicSettings
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

export default function PeriodSelect({ settings }: Props) {
  const t = useTranslations('PeriodSelectContent')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    dashboard: { setPeriod },
  } = useContext(GlobalContext)
  const periodParam = searchParams.get('period')
  const customPeriod = parseCustomPeriod(settings.dashboard.customPeriod)
  const periodOptions = [
    { label: t('7days'), value: '7days' },
    { label: t('days', { count: customPeriod }), value: 'custom' },
    { label: t('pastYear'), value: 'pastYear' },
    { label: t('allTime'), value: 'allTime' },
  ]
  const validPeriodValues = periodOptions.map((option) => option.value)
  const isValidPeriod = periodParam && validPeriodValues.includes(periodParam)

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

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const isDefault = e.target.value === 'custom'

    setPeriod(
      isDefault
        ? undefined
        : (e.target.value as DashboardSearchParams['period']),
    )
    router.push(
      `${pathname}${getUpdatedQueryParams(isDefault ? '' : e.target.value)}`,
    )
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
    <div className='input-wrapper'>
      <div className='select-wrapper'>
        <select
          className='input input--small'
          value={isValidPeriod ? periodParam : 'custom'}
          onChange={handleChange}
          aria-label={t('label')}
        >
          {periodOptions.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
