'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

type Props = {
  ratingKey: number
  serverId: string
}

export default function PlexDeeplink({ ratingKey, serverId }: Props) {
  const [plexUrl, setPlexUrl] = useState<string>(
    `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`,
  )
  const t = useTranslations('PlexDeeplink')

  useEffect(() => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setPlexUrl(
        `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${serverId}`,
      )
    }
  }, [ratingKey, serverId])

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
