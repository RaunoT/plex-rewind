'use client'

import { useRouter } from 'next/navigation'
import { IPlexClientDetails, PlexOauth } from 'plex-oauth'
import { useEffect, useState } from 'react'
import xml2js from 'xml2js'
import { useGlobalContext } from './Wrapper'

const clientInformation: IPlexClientDetails = {
  clientIdentifier: 'plex_rewind',
  product: 'Plex Rewind',
  device: 'YOUR_DEVICE_NAME', // TODO:: What should this be?
  version: '1',
  forwardUrl: 'http://localhost:3000', // TODO: Add site URL
  platform: 'Web',
  urlencode: true,
}

const plexOauth = new PlexOauth(clientInformation)

export default function PlexLoginComponent() {
  const { globalState, setGlobalState } = useGlobalContext()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const router = useRouter()

  const handleLogin = async () => {
    try {
      const [hostedUILink, pinId] = await plexOauth.requestHostedLoginURL()

      localStorage.setItem('plexPinId', pinId.toString())
      router.push(hostedUILink)
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  useEffect(() => {
    const fetchUser = async (authToken: string) => {
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

        setGlobalState({
          ...globalState,
          user: {
            thumb: result.user.$.thumb,
            name: result.user.$.title,
            isLoggedIn: isLoggedIn,
          },
        })
      } catch (error) {
        console.error('Error fetching or parsing data:', error)

        return null
      }
    }

    const getAuthToken = async () => {
      const storedPinId = Number(localStorage.getItem('plexPinId'))

      if (storedPinId) {
        try {
          // TODO: We should not use the token publicly
          // https://github.com/Dmbob/plex-oauth#overview
          const token = await plexOauth.checkForAuthToken(storedPinId)

          if (token) {
            localStorage.removeItem('plexPinId')
            fetchUser(token)
            setIsLoggedIn(true)
          }
        } catch (err) {
          console.error(err)
        }
      }
    }

    getAuthToken()
  }, [globalState, setGlobalState, isLoggedIn])

  return (
    !isLoggedIn && (
      <button
        className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
        onClick={handleLogin}
      >
        Log in with Plex
      </button>
    )
  )
}
