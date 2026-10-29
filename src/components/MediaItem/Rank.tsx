// Gold, silver and bronze for the top three
const RANK_COLORS = [
  'bg-linear-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent',
  'bg-linear-to-b from-white to-neutral-300 bg-clip-text text-transparent',
  'bg-linear-to-b from-orange-300 to-orange-600 bg-clip-text text-transparent',
]

type Props = {
  // From 0
  rank: number
}

// Beside the picture, or a badge on its corner on phones. The parent sets the
// position and moves the picture in by the badge's overhang.
export default function Rank({ rank }: Props) {
  return (
    <span className='text-center text-2xl leading-none font-bold tracking-tight tabular-nums max-sm:absolute max-sm:top-0 max-sm:left-0 max-sm:z-10 max-sm:flex max-sm:size-6 max-sm:items-center max-sm:justify-center max-sm:rounded-full max-sm:border max-sm:border-white/15 max-sm:bg-neutral-900 max-sm:text-xs sm:w-8'>
      <span
        className={
          RANK_COLORS[rank] || 'text-neutral-500 max-sm:text-neutral-300'
        }
      >
        {rank + 1}
      </span>
    </span>
  )
}
