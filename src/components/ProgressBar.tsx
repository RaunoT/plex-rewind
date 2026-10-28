import clsx from 'clsx'

type Props = {
  // From 0 to 1
  value: number
  label: string
  // For progress that isn't moving, such as a read that stopped
  isMuted?: boolean
}

// Drawn like the playback progress on the activity page
export default function ProgressBar({ value, label, isMuted }: Props) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)

  return (
    <div
      role='progressbar'
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className='h-1.5 w-full overflow-hidden rounded-full bg-white/10'
    >
      <div
        className={clsx(
          'h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500',
          isMuted ? 'bg-neutral-500' : 'bg-white',
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
