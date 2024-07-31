'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useContext, useEffect } from 'react'
import { Switch } from 'react-aria-components'
import { DashboardContext } from './DashboardProvider'

export default function DashboardPersonalToggle() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isDashboardPersonal, setIsDashboardPersonal } =
    useContext(DashboardContext)

  const updateURL = useCallback(() => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries()),
    )

    if (isDashboardPersonal) {
      currentParams.set('personal', 'true')
    } else {
      currentParams.delete('personal')
    }

    const search = currentParams.toString()
    const query = search ? `?${search}` : ''

    router.push(`${pathname}${query}`)
  }, [isDashboardPersonal, router, pathname, searchParams])

  useEffect(() => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries()),
    )

    setIsDashboardPersonal(currentParams.get('personal') === 'true')
  }, [searchParams, setIsDashboardPersonal])

  useEffect(() => {
    updateURL()
  }, [isDashboardPersonal, updateURL])

  return (
    <Switch
      className='switch'
      name='isDashboardPersonal'
      onChange={setIsDashboardPersonal}
      isSelected={isDashboardPersonal}
    >
      <div className='indicator' />
      <span className='label w-fit'>Personal</span>
    </Switch>
  )
}
