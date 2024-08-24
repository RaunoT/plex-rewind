'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useCallback, useContext, useEffect } from 'react'

type Props = {
  className?: string
}

export default function DashboardFilters({ className }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    dashboard: { isPersonal, setIsPersonal, sortBy, setSortBy },
  } = useContext(GlobalContext)

  // eslint-disable-next-line @stylistic/js/padding-line-between-statements
  const updateURL = useCallback(() => {
    const currentParams = new URLSearchParams(searchParams.toString())

    if (isPersonal === 'true') {
      currentParams.set('personal', 'true')
    } else {
      currentParams.delete('personal')
    }

    if (sortBy === 'plays') {
      currentParams.set('sortBy', 'plays')
    } else {
      currentParams.delete('sortBy')
    }

    const search = currentParams.toString()
    const query = search ? `?${search}` : ''

    router.push(`${pathname}${query}`)
  }, [isPersonal, sortBy, router, pathname, searchParams])

  // eslint-disable-next-line @stylistic/js/padding-line-between-statements
  const handlePersonalChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setIsPersonal(e.target.value === 'true' ? 'true' : undefined)
      updateURL()
    },
    [setIsPersonal, updateURL],
  )

  // eslint-disable-next-line @stylistic/js/padding-line-between-statements
  const handleSortChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      setSortBy(e.target.value === 'plays' ? 'plays' : undefined)
      updateURL()
    },
    [setSortBy, updateURL],
  )

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString())
    const personalParam = currentParams.get('personal')
    const sortByParam = currentParams.get('sortBy')

    setIsPersonal(personalParam === 'true' ? 'true' : undefined)
    setSortBy(sortByParam === 'plays' ? 'plays' : undefined)
  }, [searchParams, setIsPersonal, setSortBy])

  useEffect(() => {
    updateURL()
  }, [isPersonal, sortBy, updateURL])

  return (
    <div className={clsx('flex gap-3', className)}>
      <div className='input-wrapper'>
        <label htmlFor='style-select' className='sr-only'>
          Style
        </label>
        <div className='select-wrapper select-wrapper--small'>
          <select
            id='style-select'
            className='input input--small'
            value={isPersonal === 'true' ? 'true' : ''}
            onChange={handlePersonalChange}
          >
            <option disabled>Style</option>
            <option value=''>General</option>
            <option value='true'>Personal</option>
          </select>
        </div>
      </div>
      <div className='input-wrapper'>
        <label htmlFor='sort-select' className='sr-only'>
          Sort by
        </label>
        <div className='select-wrapper select-wrapper--small'>
          <select
            id='sort-select'
            className='input input--small'
            value={sortBy === 'plays' ? 'plays' : ''}
            onChange={handleSortChange}
          >
            <option disabled>Sort</option>
            <option value=''>By duration</option>
            <option value='plays'>By plays</option>
          </select>
        </div>
      </div>
    </div>
  )
}
