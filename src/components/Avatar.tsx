'use client'

import ImageFallback from '@/components/ImageFallback'
import { getInitials } from '@/utils/formatting'
import { getImageProxyUrl } from '@/utils/imageProxy'
import Image from 'next/image'
import { useState } from 'react'

type Props = {
  src?: string | null
  name: string
  alt?: string
  sizes: string
  priority?: boolean
}

// Fills its parent, which sets the size and shape. Accounts without a picture
// get their initials, like a contact without a photo. The image proxy turns
// away the coloured letters Plex generates for them, so those fall back too.
export default function Avatar({
  src,
  name,
  alt = '',
  sizes,
  priority,
}: Props) {
  const imageSrc = src ? getImageProxyUrl(src) : null
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!imageSrc || failedSrc === imageSrc) {
    return (
      <ImageFallback alt={alt}>
        <span className='text-[40cqw] leading-none'>{getInitials(name)}</span>
      </ImageFallback>
    )
  }

  return (
    <Image
      fill
      className='object-cover object-top'
      alt={alt}
      src={imageSrc}
      sizes={sizes}
      onError={() => setFailedSrc(imageSrc)}
      priority={priority}
    />
  )
}
