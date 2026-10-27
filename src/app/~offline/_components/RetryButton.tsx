'use client'

import { useTranslations } from 'next-intl'

export default function RetryButton() {
  const t = useTranslations('Offline')

  return (
    // Reloads the page that failed to load, which the address bar still shows
    <button
      type='button'
      className='button w-full'
      onClick={() => window.location.reload()}
    >
      {t('retry')}
    </button>
  )
}
