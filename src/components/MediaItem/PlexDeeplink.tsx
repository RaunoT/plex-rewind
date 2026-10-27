'use client'

import useIsIos from '@/hooks/useIsIos'
import { generateDeeplinkUrl } from '@/utils/deeplink'
import { useTranslations } from 'next-intl'

type Props = {
  title: string
  ratingKey: number
  serverId: string
}

export default function PlexDeeplink({ title, ratingKey, serverId }: Props) {
  const t = useTranslations('PlexDeeplink')
  const isIos = useIsIos()
  const plexUrl = generateDeeplinkUrl(ratingKey, serverId, isIos)

  return (
    <a
      href={plexUrl}
      target='_blank'
      rel='noopener noreferrer'
      className='button-card'
      aria-label={t('availableLabel', { title })}
    >
      {/* The chevron from the Plex logo */}
      <svg
        aria-hidden='true'
        viewBox='104.1 13.5 27.9 40.7'
        className='fill-plex h-3.5! w-auto!'
      >
        <path d='m117.9 33.9-13.8-20.4h14.2L132 33.9l-13.7 20.3h-14.2z' />
      </svg>
      {t('available')}
    </a>
  )
}
