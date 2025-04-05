import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  isPaused: boolean
  pause: () => void
  resume: () => void
}

export default function StoryWrapper({
  children,
  isPaused,
  pause,
  resume,
}: Props) {
  return (
    <>
      {children}
      <button
        className='absolute -bottom-11 right-0 z-10 size-5 sm:-right-4'
        onClick={() => (isPaused ? resume() : pause())}
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </button>
    </>
  )
}
