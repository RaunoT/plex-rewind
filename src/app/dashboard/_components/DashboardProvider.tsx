'use client'

import { createContext, ReactNode, useState } from 'react'

type Props = {
  children: ReactNode
}

type DashboardContextProps = {
  isDashboardPersonal: boolean
  setIsDashboardPersonal: (isDashboardPersonal: boolean) => void
}

export const DashboardContext = createContext<DashboardContextProps>({
  isDashboardPersonal: false,
  setIsDashboardPersonal: () => {},
})

export default function DashboardProvider({ children }: Props) {
  const [isDashboardPersonal, setIsDashboardPersonal] = useState<boolean>(false)

  return (
    <DashboardContext.Provider
      value={{ isDashboardPersonal, setIsDashboardPersonal }}
    >
      {children}
    </DashboardContext.Provider>
  )
}
