'use client'

import useIsIos from '@/hooks/useIsIos'
import { MediaServer } from '@/types/statsSource'
import { generateDeeplinkUrl } from '@/utils/deeplink'
import { getMediaServerName } from '@/utils/mediaServerName'
import { PlayIcon } from '@heroicons/react/24/solid'
import { useTranslations } from 'next-intl'

type Props = {
  title: string
  ratingKey: number | string
  mediaServer: MediaServer
}

export default function MediaServerDeeplink({
  title,
  ratingKey,
  mediaServer,
}: Props) {
  const t = useTranslations('MediaServerDeeplink')
  const isIos = useIsIos()
  const href = generateDeeplinkUrl(ratingKey, mediaServer, isIos)

  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='button-card'
      aria-label={t('availableLabel', {
        title,
        server: getMediaServerName(mediaServer.type),
      })}
    >
      {mediaServer.type === 'plex' ? (
        // The chevron from the Plex logo
        <svg
          aria-hidden='true'
          viewBox='104.1 13.5 27.9 40.7'
          className='fill-plex h-3.5! w-auto!'
        >
          <path d='m117.9 33.9-13.8-20.4h14.2L132 33.9l-13.7 20.3h-14.2z' />
        </svg>
      ) : (
        <PlayIcon aria-hidden='true' className='text-jellyfin' />
      )}
      {t('available')}
    </a>
  )
}
