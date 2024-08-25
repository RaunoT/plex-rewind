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

export default function GlobalContextProvider({ children }: Props) {
  const [isPersonal, setIsPersonal] = useState<
    DashboardSearchParams['personal']
  >(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(
        'dashboardPersonal',
      ) as DashboardSearchParams['personal']
    }

    return undefined
  })
  const [period, setPeriod] = useState<DashboardSearchParams['period']>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(
        'dashboardPeriod',
      ) as DashboardSearchParams['period']
    }

    return undefined
  })
  const [sortBy, setSortBy] = useState<DashboardSearchParams['sortBy']>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(
        'dashboardSort',
      ) as DashboardSearchParams['sortBy']
    }

    return undefined
  })

  useEffect(() => {
    localStorage.setItem('dashboardPersonal', isPersonal || '')
  }, [isPersonal])

  useEffect(() => {
    localStorage.setItem('dashboardPeriod', period || '')
  }, [period])

  useEffect(() => {
    localStorage.setItem('dashboardSort', sortBy || '')
  }, [sortBy])

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
