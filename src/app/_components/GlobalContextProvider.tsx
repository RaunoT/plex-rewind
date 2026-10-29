'use client'

import { DashboardSearchParams } from '@/types/dashboard'
import {
  ACTIVITY_DETAILS_COOKIE_NAME,
  DASHBOARD_PERIOD_COOKIE_NAME,
} from '@/utils/constants'
import { createContext, ReactNode, useEffect, useState } from 'react'

type GlobalContextProps = {
  dashboard: {
    isPersonal: DashboardSearchParams['personal']
    setIsPersonal: (isPersonal: DashboardSearchParams['personal']) => void
    period: DashboardSearchParams['period']
    setPeriod: (period: DashboardSearchParams['period']) => void
    sortBy: DashboardSearchParams['sortBy']
    setSortBy: (sortBy: DashboardSearchParams['sortBy']) => void
  }
  activity: {
    isDetailsHidden: boolean
    setIsDetailsHidden: (isDetailsHidden: boolean) => void
  }
}

export const GlobalContext = createContext<GlobalContextProps>({
  dashboard: {
    isPersonal: undefined,
    setIsPersonal: () => {},
    period: 'custom',
    setPeriod: () => {},
    sortBy: undefined,
    setSortBy: () => {},
  },
  activity: {
    isDetailsHidden: true,
    setIsDetailsHidden: () => {},
  },
})

type Props = {
  children: ReactNode
  // From the cookie, so the first render matches the server's
  isDetailsHidden?: boolean
}

export function readStorage(key: string): string | undefined {
  try {
    return localStorage.getItem(key) || undefined
  } catch {
    return undefined
  }
}

function writeStorage(key: string, value?: string) {
  try {
    localStorage.setItem(key, value || '')
  } catch {}
}

export default function GlobalContextProvider({
  children,
  isDetailsHidden: savedIsDetailsHidden,
}: Props) {
  const [isPersonal, setIsPersonal] =
    useState<DashboardSearchParams['personal']>(undefined)
  const [period, setPeriod] =
    useState<DashboardSearchParams['period']>(undefined)
  const [sortBy, setSortBy] =
    useState<DashboardSearchParams['sortBy']>(undefined)
  const [isDetailsHidden, setIsDetailsHidden] = useState<boolean>(
    savedIsDetailsHidden ?? true,
  )
  const [isHydrated, setIsHydrated] = useState<boolean>(false)

  useEffect(() => {
    // Read after mount so the first client render matches the server HTML
    const savedIsPersonal = readStorage(
      'dashboardPersonal',
    ) as DashboardSearchParams['personal']
    const savedPeriod = readStorage(
      'dashboardPeriod',
    ) as DashboardSearchParams['period']
    // Plays became the default, so only watch time is worth restoring
    const savedSortBy =
      readStorage('dashboardSort') === 'duration' ? 'duration' : undefined

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsPersonal((prev) => prev ?? savedIsPersonal)
    setPeriod((prev) => prev ?? savedPeriod)
    setSortBy((prev) => prev ?? savedSortBy)

    // Saved only in the browser before the cookie. Hidden by default, so
    // only showing them is worth restoring.
    if (savedIsDetailsHidden === undefined) {
      const isDetailsShown = readStorage('activityDetailsHidden') === 'false'

      setIsDetailsHidden((prev) => prev && !isDetailsShown)
    }

    setIsHydrated(true)
  }, [savedIsDetailsHidden])

  useEffect(() => {
    if (isHydrated) {
      writeStorage('dashboardPersonal', isPersonal)
    }
  }, [isHydrated, isPersonal])

  useEffect(() => {
    if (isHydrated) {
      writeStorage('dashboardPeriod', period)
      document.cookie = `${DASHBOARD_PERIOD_COOKIE_NAME}=${period ?? ''}; path=/; max-age=${period ? 31536000 : 0}; samesite=lax`
    }
  }, [isHydrated, period])

  useEffect(() => {
    if (isHydrated) {
      writeStorage('dashboardSort', sortBy)
    }
  }, [isHydrated, sortBy])

  useEffect(() => {
    if (isHydrated) {
      document.cookie = `${ACTIVITY_DETAILS_COOKIE_NAME}=${isDetailsHidden ? 'hidden' : 'shown'}; path=/; max-age=31536000; samesite=lax`
    }
  }, [isHydrated, isDetailsHidden])

  return (
    <GlobalContext.Provider
      value={{
        dashboard: {
          isPersonal,
          setIsPersonal,
          period,
          setPeriod,
          sortBy,
          setSortBy,
        },
        activity: {
          isDetailsHidden,
          setIsDetailsHidden,
        },
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
