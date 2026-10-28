'use client'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { ComponentProps, useEffect } from 'react'
import RetryButton from './RetryButton'
import StatusMessage from './StatusMessage'

export type RouteErrorProps = {
  error: Error
  reset: () => void
}

type Props = RouteErrorProps &
  Pick<ComponentProps<typeof StatusMessage>, 'as' | 'isInCard'> & {
    logPrefix: string
  }

// The content of each route's error.tsx
export default function RouteError({
  error,
  reset,
  logPrefix,
  as,
  isInCard,
}: Props) {
  const t = useTranslations('Error')
  const router = useRouter()

  useEffect(() => {
    console.error(`[${logPrefix}] - `, error)
  }, [error, logPrefix])

  return (
    <StatusMessage
      icon={ExclamationTriangleIcon}
      title={t('title')}
      as={as}
      isInCard={isInCard}
      action={
        // Resetting alone would render the same server data that failed
        <RetryButton
          onRetry={() => {
            router.refresh()
            reset()
          }}
        />
      }
    />
  )
}
