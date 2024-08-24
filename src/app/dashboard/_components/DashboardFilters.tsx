'use client'

import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ChangeEvent, useContext, useEffect } from 'react'

type Props = {
  className?: string
  isSortByPlaysActive: boolean
}

export default function DashboardFilters({
  className,
  isSortByPlaysActive,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const personalParam = searchParams.get('personal')
  const sortByParam = searchParams.get('sortBy')
  const {
    dashboard: { isPersonal, setIsPersonal, sortBy, setSortBy },
  } = useContext(GlobalContext)

  function updateURL() {
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
  }

  function handlePersonalChange(e: ChangeEvent<HTMLSelectElement>) {
    setIsPersonal(e.target.value === 'true' ? 'true' : undefined)
    updateURL()
  }

  function handleSortChange(e: ChangeEvent<HTMLSelectElement>) {
    setSortBy(e.target.value === 'plays' ? 'plays' : undefined)
    updateURL()
  }

  useEffect(() => {
    setIsPersonal(personalParam === 'true' ? 'true' : undefined)
    setSortBy(sortByParam === 'plays' ? 'plays' : undefined)
  }, [setIsPersonal, setSortBy, personalParam, sortByParam])

  return (
    <div className={clsx('flex gap-2 sm:gap-3', className)}>
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
      {isSortByPlaysActive && (
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
      )}
    </div>
  )
}
