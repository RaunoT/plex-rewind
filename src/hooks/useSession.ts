import { useEffect, useState } from 'react'

type SessionProps = {
  user?: {
    name: string
    thumb: string
    plexId: number
  }
  isLoggedIn?: boolean
}

export default function useSession() {
  const [session, setSession] = useState<SessionProps>({})

  useEffect(() => {
    const storage = sessionStorage.getItem('plexSession')

    if (storage) {
      const storedSession = JSON.parse(storage)

      setSession(storedSession)
    }
  }, [])

  const setPlexSession = (newValue: SessionProps) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('plexSession', JSON.stringify(newValue))
      setSession(newValue)
    }
  }

  const clearSession = () => {
    sessionStorage.removeItem('plexSession')
    setSession({})
  }

  return { session, setPlexSession, clearSession }
}
