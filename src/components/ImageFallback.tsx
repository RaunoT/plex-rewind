import { ReactNode } from 'react'

type Props = {
  // Read out in the picture's place, or left out when it's only decoration
  alt?: string
  // Initials or an icon, sized against the frame with `cqw`
  children: ReactNode
}

// What stands in for any missing picture: white on the grey of a contact
// without a photo, dark enough for white to read. Fills its parent, which
// sets the size and shape.
export default function ImageFallback({ alt, children }: Props) {
  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className='@container absolute inset-0 flex items-center justify-center bg-linear-to-b from-[#6e7380] to-[#50545e] font-medium text-white select-none'
    >
      {children}
    </span>
  )
}
