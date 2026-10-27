'use client'

import usePlexAuth from '@/hooks/usePlexAuth'
import { useTranslations } from 'next-intl'
import LoginWithPlexLabel from './LoginWithPlexLabel'

export default function LoginButton({ siteUrl }: { siteUrl: string }) {
  const { isLoading, error, handleLogin } = usePlexAuth(siteUrl)
  const t = useTranslations('Home')

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
