'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useCallback, useContext, useEffect } from 'react'

type Props = {
  className?: string
  isSortByPlaysActive: boolean
  personalFilter: boolean
}

export default function DashboardFilters({
  className,
  isSortByPlaysActive,
  personalFilter,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const personalParam = searchParams.get('personal')
  const sortByParam = searchParams.get('sortBy')
  const {
    dashboard: { isPersonal, setIsPersonal, sortBy, setSortBy },
  } = useContext(GlobalContext)
  const t = useTranslations('DashboardFilters')

  // eslint-disable-next-line @stylistic/js/padding-line-between-statements
  const updateURL = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (isPersonal === 'true') {
      params.set('personal', 'true')
    } else {
      params.delete('personal')
    }

    if (sortBy === 'plays') {
      params.set('sortBy', 'plays')
    } else {
      params.delete('sortBy')
    }

    const query = params.toString() ? `?${params.toString()}` : ''

    router.push(`${pathname}${query}`)
  }, [isPersonal, sortBy, pathname, searchParams, router])

  function handlePersonalChange(e: ChangeEvent<HTMLSelectElement>) {
    setIsPersonal(e.target.value === 'true' ? 'true' : undefined)
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value === 'plays' ? 'plays' : undefined)
  }

  useEffect(() => {
    updateURL()
  }, [isPersonal, sortBy, updateURL])

  useEffect(() => {
    setIsPersonal(personalParam === 'true' ? 'true' : undefined)
    setSortBy(sortByParam === 'plays' ? 'plays' : undefined)
  }, [setIsPersonal, setSortBy, personalParam, sortByParam])

  return (
    <div className={clsx('mt-auto flex gap-2 sm:mt-0 sm:gap-3', className)}>
      {personalFilter && (
        <div className='input-wrapper'>
          <div className='select-wrapper select-wrapper--small'>
            <select
              id='style-select'
              className='input input--small'
              value={isPersonal === 'true' ? 'true' : ''}
              onChange={handlePersonalChange}
              aria-label={t('type')}
            >
              <option disabled>{t('type')}</option>
              <option value=''>{t('general')}</option>
              <option value='true'>{t('personal')}</option>
            </select>
          </div>
        </div>
      )}
      {isSortByPlaysActive && (
        <div className='input-wrapper'>
          <div className='select-wrapper select-wrapper--small'>
            <select
              id='sort-select'
              className='input input--small'
              value={sortBy === 'plays' ? 'plays' : ''}
              onChange={handleSortChange}
              aria-label={t('sortByLabel')}
            >
              <option disabled>{t('sort')}</option>
              <option value=''>{t('byDuration')}</option>
              <option value='plays'>{t('byPlays')}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
