import { useEffect, useMemo, useState } from 'react'

type SessionProps = {
  user?: {
    name: string
    thumb: string
    plexId: number
  }
  isLoggedIn: boolean
}

const defaultSession: SessionProps = {
  isLoggedIn: false,
}

export default function useSession() {
  const [session, setSession] = useState<SessionProps>(defaultSession)

  const setPlexSession = (newValue: SessionProps) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('plexSession', JSON.stringify(newValue))
      setSession(newValue)
      window.dispatchEvent(new Event('sessionUpdate'))
    }
  }

  const clearSession = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('plexSession')
      setSession(defaultSession)
    }
  }

  const memoizedSession = useMemo(() => session, [session])

  useEffect(() => {
    const handleSessionChange = () => {
      const storage = sessionStorage.getItem('plexSession')

      if (storage) {
        const storedSession = JSON.parse(storage)
        setSession(storedSession)
      }
    }

    window.addEventListener('sessionUpdate', handleSessionChange)
    handleSessionChange()

    return () => {
      window.removeEventListener('sessionUpdate', handleSessionChange)
    }
  }, [])

  return {
    session: memoizedSession,
    setSession: setPlexSession,
    clearSession,
  }
}
