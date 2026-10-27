'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type Props = {
  // Without one, the page's server data is fetched again
  onRetry?: () => unknown
}

export default function RetryButton({ onRetry }: Props) {
  const t = useTranslations('Error')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function retry() {
    startTransition(async () => {
      if (onRetry) {
        await onRetry()
      } else {
        router.refresh()
      }
    })
  }

  return (
    <button
      type='button'
      className='button w-full'
      onClick={retry}
      disabled={isPending}
    >
      {t('cta')}
    </button>
  )
}
