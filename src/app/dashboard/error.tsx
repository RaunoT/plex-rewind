'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

type Props = {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: Props) {
  const t = useTranslations('Error')

  useEffect(() => {
    console.error('[DASHBOARD] - ', error)
  }, [error])

  return (
    <div className='flex flex-1 flex-col justify-center text-center'>
      <h1 className='mb-4 text-3xl italic leading-tight sm:text-4xl'>
        {t('title')}
      </h1>
      <button className='link mx-auto w-fit' onClick={() => reset()}>
        {t('cta')}
      </button>
    </div>
  )
}
