'use client'

import { useTranslations } from 'next-intl'

export default function RetryButton() {
  const t = useTranslations('Offline')

  return (
    <button className='button mx-auto' onClick={() => window.location.reload()}>
      {t('retry')}
    </button>
  )
}
