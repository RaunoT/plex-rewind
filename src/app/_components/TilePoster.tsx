'use client'

import placeholderSvg from '@/components/MediaItem/placeholder.svg'
import Image from 'next/image'
import { useState } from 'react'

// Shows the same placeholder as media rows when there's no artwork or it fails
export default function TilePoster({ src }: { src?: string }) {
  const [hasFailed, setHasFailed] = useState(false)

  return (
    <Image
      fill
      className='object-cover object-top'
      alt=''
      src={src && !hasFailed ? src : placeholderSvg}
      sizes='6rem'
      onError={() => setHasFailed(true)}
    />
  )
}
