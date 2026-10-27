'use client'

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
// get grey initials, like a contact without a photo, on a grey dark enough
// for white text. The image proxy turns away the coloured letters Plex
// generates for them, so those fall back too.
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
      <span
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className='@container absolute inset-0 flex items-center justify-center bg-linear-to-b from-[#6e7380] to-[#50545e] font-medium text-white select-none'
      >
        <span className='text-[40cqw] leading-none'>{getInitials(name)}</span>
      </span>
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
