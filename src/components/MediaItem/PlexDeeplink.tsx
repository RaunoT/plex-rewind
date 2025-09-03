'use client'

import { generateDeeplinkUrl } from '@/utils/deeplink'
import { useTranslations } from 'next-intl'

type Props = {
  ratingKey: number
  serverId: string
}

export default function PlexDeeplink({ ratingKey, serverId }: Props) {
  const t = useTranslations('PlexDeeplink')
  const plexUrl = generateDeeplinkUrl(ratingKey, serverId)

  return (
    <a
      href={plexUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='button-card bg-green-600'
    >
      {t('available')}
    </a>
  )
}
