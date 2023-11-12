'use client'

import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react'

type Props = {
  children: React.ReactNode
}

type GlobalState = {
  user: {
    name: string
    thumb: string
    isLoggedIn: boolean
  }
}

const GlobalContext = createContext({
  globalState: {} as Partial<GlobalState>,
  setGlobalState: {} as Dispatch<SetStateAction<Partial<GlobalState>>>,
})

export const useGlobalContext = () => useContext(GlobalContext)

export default function Wrapper({ children }: Props) {
  const [globalState, setGlobalState] = useState<Partial<GlobalState>>(
    {} as GlobalState,
  )
  const pathname = usePathname()

  return (
    <GlobalContext.Provider value={{ globalState, setGlobalState }}>
      <main
        className={clsx(
          'min-height-screen flex flex-col items-center overflow-x-hidden px-4 py-8 sm:justify-center',
          { 'justify-center': pathname === '/' },
        )}
      >
        {children}
      </main>
    </GlobalContext.Provider>
  )
}
