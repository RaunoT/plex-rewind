import { ReactNode } from 'react'

type Props = {
  // The skeleton shown while the content loads
  skeleton: ReactNode
  // What's shown in the content's place, such as an empty or error message
  children: ReactNode
}

// Over a hidden copy of the skeleton, so the card keeps the size it had while
// loading, whatever the settings and the screen width make it
export default function SkeletonSized({ skeleton, children }: Props) {
  return (
    <div className='grid flex-1'>
      <div className='invisible col-start-1 row-start-1' aria-hidden='true'>
        {skeleton}
      </div>
      <div className='col-start-1 row-start-1 flex flex-col'>{children}</div>
    </div>
  )
}
