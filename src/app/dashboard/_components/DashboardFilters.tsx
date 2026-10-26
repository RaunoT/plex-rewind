'use client'

import {
  GlobalContext,
  readStorage,
} from '@/app/_components/GlobalContextProvider'
import { DashboardSearchParams } from '@/types/dashboard'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useCallback, useContext, useEffect, useId } from 'react'

type Props = {
  className?: string
  isSortByPlaysActive: boolean
  personalFilter: boolean
}

// Saved filters are applied once per page load, when a dashboard is opened
// without any in its URL. After that the URL is the only source of truth, so
// Back and Forward keep working.
let hasRestoredSavedFilters = false

export default function DashboardFilters({
  className,
  isSortByPlaysActive,
  personalFilter,
}: Props) {
  const id = useId()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isPersonal: DashboardSearchParams['personal'] =
    searchParams.get('personal') === 'true' ? 'true' : undefined
  const sortBy: DashboardSearchParams['sortBy'] =
    searchParams.get('sortBy') === 'plays' ? 'plays' : undefined
  const hasUrlFilters =
    searchParams.has('personal') || searchParams.has('sortBy')
  const {
    dashboard: { setIsPersonal, setSortBy },
  } = useContext(GlobalContext)
  const t = useTranslations('DashboardFilters')

  // eslint-disable-next-line @stylistic/padding-line-between-statements
  const getUrl = useCallback(
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

      const query = params.toString()

      return query ? `${pathname}?${query}` : pathname
    },
    [pathname, searchParams],
  )

  function handlePersonalChange(e: ChangeEvent<HTMLSelectElement>) {
    router.push(getUrl(e.target.value === 'true' ? 'true' : undefined, sortBy))
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    router.push(
      getUrl(isPersonal, e.target.value === 'plays' ? 'plays' : undefined),
    )
  }

  useEffect(() => {
    if (!hasRestoredSavedFilters) {
      hasRestoredSavedFilters = true

      const savedPersonal =
        personalFilter && readStorage('dashboardPersonal') === 'true'
          ? 'true'
          : undefined
      const savedSort =
        isSortByPlaysActive && readStorage('dashboardSort') === 'plays'
          ? 'plays'
          : undefined

      if (!hasUrlFilters && (savedPersonal || savedSort)) {
        router.replace(getUrl(savedPersonal, savedSort))

        return
      }
    }

    // Remembered for the next visit and for the links on the home page
    setIsPersonal(isPersonal)
    setSortBy(sortBy)
  }, [
    getUrl,
    hasUrlFilters,
    isPersonal,
    isSortByPlaysActive,
    personalFilter,
    router,
    setIsPersonal,
    setSortBy,
    sortBy,
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
