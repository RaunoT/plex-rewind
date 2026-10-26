'use client'

import useIsIos from '@/hooks/useIsIos'
import { generateDeeplinkUrl } from '@/utils/deeplink'
import { useTranslations } from 'next-intl'

type Props = {
  ratingKey: number
  serverId: string
}

export default function PlexDeeplink({ ratingKey, serverId }: Props) {
  const t = useTranslations('PlexDeeplink')
  const isIos = useIsIos()
  const plexUrl = generateDeeplinkUrl(ratingKey, serverId, isIos)

  return (
    <a
      href={plexUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='button-card bg-green-700'
    >
      {t('available')}
    </a>
  )
}
