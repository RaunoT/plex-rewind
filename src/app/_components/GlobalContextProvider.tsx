'use client'

import { DashboardSearchParams } from '@/types/dashboard'
import { DASHBOARD_PERIOD_COOKIE_NAME } from '@/utils/constants'
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
    isDetailsHidden: false,
    setIsDetailsHidden: () => {},
  },
})

type Props = {
  children: ReactNode
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

export default function GlobalContextProvider({ children }: Props) {
  const [isPersonal, setIsPersonal] =
    useState<DashboardSearchParams['personal']>(undefined)
  const [period, setPeriod] =
    useState<DashboardSearchParams['period']>(undefined)
  const [sortBy, setSortBy] =
    useState<DashboardSearchParams['sortBy']>(undefined)
  const [isDetailsHidden, setIsDetailsHidden] = useState<boolean>(false)
  const [isHydrated, setIsHydrated] = useState<boolean>(false)

  useEffect(() => {
    try {
      // Read after mount so the first client render matches the server HTML
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPersonal(
        (prev) =>
          prev ??
          ((localStorage.getItem('dashboardPersonal') ||
            undefined) as DashboardSearchParams['personal']),
      )
      setPeriod(
        (prev) =>
          prev ??
          ((localStorage.getItem('dashboardPeriod') ||
            undefined) as DashboardSearchParams['period']),
      )
      // Plays became the default, so only watch time is worth restoring
      setSortBy(
        (prev) =>
          prev ??
          (localStorage.getItem('dashboardSort') === 'duration'
            ? 'duration'
            : undefined),
      )
      setIsDetailsHidden(
        (prev) =>
          prev || localStorage.getItem('activityDetailsHidden') === 'true',
      )
    } catch {}

    setIsHydrated(true)
  }, [])

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
      writeStorage('activityDetailsHidden', isDetailsHidden ? 'true' : '')
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
