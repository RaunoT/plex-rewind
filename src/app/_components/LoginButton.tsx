'use client'

import usePlexAuth from '@/hooks/usePlexAuth'
import { useTranslations } from 'next-intl'

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
        {t('loginWithPlex')}
      </button>
      {/* Below the button, so the header keeps its layout */}
      {error && (
        <p
          role='alert'
          className='glass absolute top-full right-0 z-10 mt-2 w-64 rounded-2xl p-3 text-sm text-red-300'
        >
          {t(`loginError.${error}`)}
        </p>
      )}
    </div>
  )
}
