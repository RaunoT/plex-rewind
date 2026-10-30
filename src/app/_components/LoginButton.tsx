'use client'

import usePlexAuth from '@/hooks/usePlexAuth'
import { MediaServerType } from '@/types/settings'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import JellyfinLoginForm from './JellyfinLoginForm'
import LoginWithJellyfinLabel from './LoginWithJellyfinLabel'
import LoginWithPlexLabel from './LoginWithPlexLabel'

type Props = {
  siteUrl: string
  mediaServerType: MediaServerType
}

export default function LoginButton({ siteUrl, mediaServerType }: Props) {
  const { isLoading, error, handleLogin } = usePlexAuth(siteUrl)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const t = useTranslations('Home')

  if (mediaServerType === 'jellyfin') {
    return (
      <div className='relative'>
        <button
          className='button button--jellyfin button-sm'
          onClick={() => setIsFormOpen(!isFormOpen)}
          aria-expanded={isFormOpen}
        >
          <LoginWithJellyfinLabel />
        </button>
        {/* Below the button, so the header keeps its layout */}
        {isFormOpen && (
          <div className='glass absolute top-full right-0 z-10 mt-2 w-72 rounded-2xl p-4'>
            <JellyfinLoginForm />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='relative'>
      <button
        className='button button--plex button-sm'
        onClick={handleLogin}
        disabled={isLoading}
      >
        <LoginWithPlexLabel />
      </button>
      {/* Below the button, so the header keeps its layout */}
      {error && (
        <p
          role='alert'
          className='glass text-danger absolute top-full right-0 z-10 mt-2 w-64 rounded-2xl p-3 text-sm'
        >
          {t(`loginError.${error}`)}
        </p>
      )}
    </div>
  )
}
