'use client'

import usePlexAuth from '@/hooks/usePlexAuth'
import { useTranslations } from 'next-intl'

export default function LoginButton({ siteUrl }: { siteUrl: string }) {
  const { isLoading, handleLogin } = usePlexAuth(siteUrl)
  const t = useTranslations('Home')

  return (
    <button
      className='button button--plex button-sm'
      onClick={handleLogin}
      disabled={isLoading}
    >
      {t('loginWithPlex')}
    </button>
  )
}
