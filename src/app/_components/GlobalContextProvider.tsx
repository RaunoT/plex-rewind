'use client'

import { DashboardSearchParams } from '@/types/dashboard'
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
})

type Props = {
  children: ReactNode
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
      setSortBy(
        (prev) =>
          prev ??
          ((localStorage.getItem('dashboardSort') ||
            undefined) as DashboardSearchParams['sortBy']),
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
    }
  }, [isHydrated, period])

  useEffect(() => {
    if (isHydrated) {
      writeStorage('dashboardSort', sortBy)
    }
  }, [isHydrated, sortBy])

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
      }}
    >
      {children}
    </GlobalContext.Provider>
  )
}
