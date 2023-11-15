'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PlexOauth } from 'plex-oauth'
import { useEffect } from 'react'

const clientInformation = {
  clientIdentifier: 'plex_rewind',
  product: 'Plex Rewind',
  device: 'browser', // TODO: What should this be?
  version: '1',
  forwardUrl: `${process.env.NEXT_PUBLIC_SITE_URL}?pin=ok`,
  platform: 'Web',
  urlencode: true,
}

const plexOauth = new PlexOauth(clientInformation)

export default function PlexLoginComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleLogin = async () => {
    try {
      const [hostedUILink, pinId] = await plexOauth.requestHostedLoginURL()

      sessionStorage.setItem('plexPinId', pinId.toString())
      router.push(hostedUILink)
    } catch (err) {
      console.error('Something went wrong with Plex OAuth:', err)
    }
  }

  const authUser = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pinId: sessionStorage.getItem('plexPinId'),
          clientInformation,
        }),
      })

      if (!res.ok) {
        console.error('User authentication failed:', res.status)
      }
    } catch (e) {
      console.error('User authentication failed', e)
    }
  }

  useEffect(() => {
    if (
      searchParams.get('pin') === 'ok' &&
      sessionStorage.getItem('plexPinId')
    ) {
      authUser()
    }
  })

  return (
    <button
      className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
      onClick={handleLogin}
    >
      Log in with Plex
    </button>
  )
}
