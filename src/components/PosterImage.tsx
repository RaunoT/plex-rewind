'use client'

import { MediaIcon } from '@/components/icons'
import ImageFallback from '@/components/ImageFallback'
import Image from 'next/image'
import { useState } from 'react'

type Props = {
  // Tried in turn, so TMDB's can stand in for one the source can't serve
  srcs: (string | null | undefined)[]
  // The kind of media, whose icon shows when none of them load
  type: string
  alt?: string
  sizes: string
  priority?: boolean
}

// Fills its parent, like the poster frame
export default function PosterImage({
  srcs,
  type,
  alt = '',
  sizes,
  priority,
}: Props) {
  const [failedSrcs, setFailedSrcs] = useState<string[]>([])
  const src = srcs.find(
    (source): source is string => !!source && !failedSrcs.includes(source),
  )

  if (!src) {
    return (
      <ImageFallback alt={alt}>
        <MediaIcon type={type} className='size-[40cqw]' />
      </ImageFallback>
    )
  }

  return (
    <Image
      fill
      className='object-cover object-top'
      alt={alt}
      src={src}
      sizes={sizes}
      onError={() => setFailedSrcs((failed) => [...failed, src])}
      priority={priority}
    />
  )
}
