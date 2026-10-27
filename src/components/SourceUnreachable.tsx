import { StatisticsSource } from '@/types/settings'
import { STATS_SOURCE_NAMES } from '@/utils/constants'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { ComponentProps } from 'react'
import RetryButton from './RetryButton'
import StatusMessage from './StatusMessage'

type Props = Pick<ComponentProps<typeof StatusMessage>, 'as' | 'isInCard'> &
  Pick<ComponentProps<typeof RetryButton>, 'onRetry'> & {
    source: StatisticsSource
    // Only admins can fix the connection settings
    isAdmin?: boolean
  }

// Shown instead of the empty lists an unreachable source returns, so they
// aren't mistaken for having no data
export default function SourceUnreachable({
  source,
  isAdmin,
  onRetry,
  as,
  isInCard,
}: Props) {
  const t = useTranslations('Error')
  const name = STATS_SOURCE_NAMES[source]

  return (
    <StatusMessage
      title={t('sourceUnreachable', { source: name })}
      description={t('sourceUnreachableDescription', { source: name })}
      as={as}
      isInCard={isInCard}
      action={
        <>
          <RetryButton onRetry={onRetry} />
          {isAdmin && (
            <Link href='/settings/connection' className='link text-sm'>
              {t('connectionSettings')}
            </Link>
          )}
        </>
      }
    />
  )
}
