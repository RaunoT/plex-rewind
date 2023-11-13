'use client'

import useSession from '@/hooks/useSession'
import { useRouter } from 'next/navigation'
import { IPlexClientDetails, PlexOauth } from 'plex-oauth'
import { useEffect } from 'react'
import xml2js from 'xml2js'

const clientInformation: IPlexClientDetails = {
  clientIdentifier: 'plex_rewind',
  product: 'Plex Rewind',
  device: 'browser', // TODO: What should this be?
  version: '1',
  forwardUrl: process.env.NEXT_PUBLIC_SITE_URL,
  platform: 'Web',
  urlencode: true,
}

const plexOauth = new PlexOauth(clientInformation)

export default function PlexLoginComponent() {
  const { setSession } = useSession()
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const [hostedUILink, pinId] = await plexOauth.requestHostedLoginURL()

      sessionStorage.setItem('plexPinId', pinId.toString())
      router.push(hostedUILink)
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  useEffect(() => {
    const fetchSession = async (authToken: string) => {
      try {
        const response = await fetch(`https://plex.tv/api/v2/user`, {
          method: 'GET',
          headers: {
            'X-Plex-Token': authToken,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const xmlData = await response.text()
        const parser = new xml2js.Parser()
        const result = await parser.parseStringPromise(xmlData)

        const plexSession = {
          user: {
            name: result.user.$.title,
            thumb: result.user.$.thumb,
            plexId: result.user.$.id,
          },
          isLoggedIn: true,
        }
        setSession(plexSession)
      } catch (error) {
        console.error('Error fetching or parsing data:', error)

        return null
      }
    }

    const getAuthToken = async () => {
      const storedPinId = Number(sessionStorage.getItem('plexPinId'))

      if (storedPinId) {
        try {
          // TODO: We should store the token for future requests, but not use it on the frontend
          // https://github.com/Dmbob/plex-oauth#overview
          const token = await plexOauth.checkForAuthToken(storedPinId)

          if (token) {
            sessionStorage.removeItem('plexPinId')
            fetchSession(token)
          }
        } catch (err) {
          console.error(err)
        }
      }
    }

    getAuthToken()
  }, [setSession])

  return (
    <button
      className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
      onClick={handleLogin}
    >
      Log in with Plex
    </button>
  )
}
