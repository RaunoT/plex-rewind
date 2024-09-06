import { createPlexAuthUrl, getPlexAuthToken } from '@/lib/auth'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function usePlexAuth() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const plexPinId = searchParams.get('plexPinId')

    async function authUser(plexPinId: string) {
      setIsLoading(true)

      try {
        const plexAuthToken = await getPlexAuthToken(plexPinId)
        const res = await signIn('plex', {
          authToken: plexAuthToken,
          callbackUrl: '/',
        })

        if (res?.error) {
          console.error('[AUTH] - Failed to sign in!', res.error)
        }
      } catch (error) {
        console.error('[AUTH] - Error during sign-in!', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (plexPinId) {
      authUser(plexPinId)
    }
  }, [searchParams])

  const handleLogin = async () => {
    const plexUrl = await createPlexAuthUrl()

    router.push(plexUrl)
  }

  return { isLoading, handleLogin }
}
