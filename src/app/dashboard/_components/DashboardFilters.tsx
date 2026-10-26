'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { DashboardSearchParams } from '@/types/dashboard'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from 'react'

type Props = {
  className?: string
  isSortByPlaysActive: boolean
  personalFilter: boolean
  syncUrl?: boolean
}

export default function DashboardFilters({
  className,
  isSortByPlaysActive,
  personalFilter,
  syncUrl = false,
}: Props) {
  const id = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const personalParam = searchParams.get('personal')
  const sortByParam = searchParams.get('sortBy')
  const urlFilters = `${personalParam}|${sortByParam}`
  const adoptedUrlFiltersRef = useRef<string | null>(null)
  const {
    dashboard: { isPersonal, setIsPersonal, sortBy, setSortBy },
  } = useContext(GlobalContext)
  const t = useTranslations('DashboardFilters')

  // eslint-disable-next-line @stylistic/padding-line-between-statements
  const updateURL = useCallback(
    (
      personal: DashboardSearchParams['personal'],
      sort: DashboardSearchParams['sortBy'],
    ) => {
      const params = new URLSearchParams(searchParams.toString())

      if (personal === 'true') {
        params.set('personal', 'true')
      } else {
        params.delete('personal')
      }

      if (sort === 'plays') {
        params.set('sortBy', 'plays')
      } else {
        params.delete('sortBy')
      }

      const newParamsString = params.toString()
      const oldParamsString = searchParams.toString()

      if (newParamsString === oldParamsString) {
        return
      }

      const query = newParamsString ? `?${newParamsString}` : ''

      router.push(`${pathname}${query}`)
    },
    [pathname, searchParams, router],
  )

  function handlePersonalChange(e: ChangeEvent<HTMLSelectElement>) {
    setIsPersonal(e.target.value === 'true' ? 'true' : undefined)
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value === 'plays' ? 'plays' : undefined)
  }

  // Filters in a new URL win over the context. A filter missing from the URL
  // keeps the saved one, which is then pushed to the URL by the owner.
  useEffect(() => {
    const isUrlAdopted = adoptedUrlFiltersRef.current === urlFilters
    const personal =
      !isUrlAdopted && personalParam !== null
        ? personalParam === 'true'
          ? 'true'
          : undefined
        : isPersonal
    const sort =
      !isUrlAdopted && sortByParam !== null
        ? sortByParam === 'plays'
          ? 'plays'
          : undefined
        : sortBy

    adoptedUrlFiltersRef.current = urlFilters

    if (personal !== isPersonal) {
      setIsPersonal(personal)
    }

    if (sort !== sortBy) {
      setSortBy(sort)
    }

    if (syncUrl) {
      updateURL(personal, sort)
    }
  }, [
    isPersonal,
    sortBy,
    personalParam,
    sortByParam,
    urlFilters,
    syncUrl,
    updateURL,
    setIsPersonal,
    setSortBy,
  ])

  return (
    <div className={clsx('mt-auto flex gap-2 sm:mt-0 sm:gap-3', className)}>
      {personalFilter && (
        <div className='input-wrapper'>
          <div className='select-wrapper select-wrapper--small'>
            <select
              id={`${id}-style`}
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
              id={`${id}-sort`}
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
