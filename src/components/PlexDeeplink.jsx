'use client'

import { useEffect, useState } from 'react'

export default function PlexDeeplink({ ratingKey, serverId }) {
  const [plexUrl, setPlexUrl] = useState(
    `https://app.plex.tv/desktop#!/server/${serverId}/details?key=%2Flibrary%2Fmetadata%2F${ratingKey}`
  )

  useEffect(() => {
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      setPlexUrl(
        `plex://preplay/?metadataKey=%2Flibrary%2Fmetadata%2F${ratingKey}&server=${serverId}`
      )
    }
  }, [ratingKey, serverId])

  return (
    <a
      href={plexUrl}
      target='_blank'
      className='block px-1 mb-2 text-[0.65rem] font-semibold uppercase rounded-sm w-fit bg-gradient-to-r from-green-500 to-green-700'
    >
      Available
    </a>
  )
}
