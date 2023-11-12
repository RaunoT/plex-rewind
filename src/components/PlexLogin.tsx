'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { IPlexClientDetails, PlexOauth } from 'plex-oauth'
import { useEffect, useState } from 'react'
import xml2js from 'xml2js'

const clientInformation: IPlexClientDetails = {
  clientIdentifier: 'plex_rewind',
  product: 'Plex Rewind',
  device: 'YOUR_DEVICE_NAME', // TODO:: What is this for?
  version: '1',
  forwardUrl: 'http://localhost:3000', // TODO: Add site URL
  platform: 'Web',
  urlencode: true,
}

const plexOauth = new PlexOauth(clientInformation)

export default function PlexLoginComponent() {
  const [userName, setuserName] = useState<string>('')
  const [userThumb, setUserThumb] = useState<string>('')
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

        setuserName(result.user.$.title)
        setUserThumb(result.user.$.thumb)
      } catch (error) {
        console.error('Error fetching or parsing data:', error)

        return null
      }
    }

    const checkAuthToken = async () => {
      const storedPinId = Number(localStorage.getItem('plexPinId'))

      if (storedPinId) {
        try {
          const token = await plexOauth.checkForAuthToken(storedPinId)
          console.log(token)

          if (token) {
            localStorage.removeItem('plexPinId')
            fetchUser(token)
          }
        } catch (err) {
          console.error(err)
        }
      }
    }

    checkAuthToken()
  }, [])

  return (
    <>
      {userName && userThumb ? (
        <>
          <div className='relative mx-auto mb-4 h-20 w-20'>
            <Image
              src={userThumb}
              alt={`${userName} profile picture`}
              className='rounded-full object-cover'
              sizes='10rem'
              fill
            />
          </div>
          <p>Welcome{userName ? `, ${userName}` : '!'}</p>
        </>
      ) : (
        <button
          className='button button-sm mx-auto from-yellow-500 via-yellow-600 to-neutral-700'
          onClick={handleLogin}
        >
          Log in with Plex
        </button>
      )}
    </>
  )
}
