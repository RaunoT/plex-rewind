import { PauseIcon, PlayIcon } from '@heroicons/react/24/outline'

type Props = {
  children: React.ReactNode
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
        className='absolute -bottom-2 -right-3 z-10 size-5'
        onClick={() => (isPaused ? resume() : pause())}
      >
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </button>
    </>
  )
}
