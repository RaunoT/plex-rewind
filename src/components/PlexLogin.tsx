'use client'

import { IPlexClientDetails, PlexOauth } from 'plex-oauth'
import { useEffect, useState } from 'react'

export default function PlexLogin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')

  const clientInformation: IPlexClientDetails = {
    clientIdentifier: 'plex-rewind',
    product: 'Plex Rewind',
    device: 'web', // TODO: What is this?
    version: '1',
    forwardUrl: 'http://localhost:3000', // TODO: Use real url
    platform: 'Web',
    urlencode: true,
  }

  const plexOauth = new PlexOauth(clientInformation)

  useEffect(() => {
    const storedUsername = localStorage.getItem('plexUsername')
    if (storedUsername) {
      setUsername(storedUsername)
      setIsAuthenticated(true)
    }
  }, [])

  const handleLogin = () => {
    plexOauth
      .requestHostedLoginURL()
      .then((data) => {
        const [hostedUILink, pinId] = data
        // Redirect user to Plex login page
        window.location.href = hostedUILink
      })
      .catch((err) => {
        console.error(err)
      })
  }

  return isAuthenticated ? (
    <div>Welcome, {username}</div>
  ) : (
    <button
      className='rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700'
      onClick={handleLogin}
    >
      Login with Plex
    </button>
  )
}
