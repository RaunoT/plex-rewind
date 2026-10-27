import {
  CalendarDaysIcon,
  ClockIcon,
  FilmIcon,
  FolderIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlusCircleIcon,
  StarIcon,
  TvIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { SVGProps } from 'react'

// A plain tomato for the Rotten Tomatoes score, drawn like the outline icons
function TomatoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
      strokeWidth={1.5}
      stroke='currentColor'
      aria-hidden='true'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 7.5c-4.556 0-8.25 2.686-8.25 6.375S7.444 20.25 12 20.25s8.25-2.686 8.25-6.375S16.556 7.5 12 7.5Z'
      />
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        d='M12 7.5v-3m0 3L9 5.25m3 2.25 3-2.25M12 7.5 9.75 9M12 7.5 14.25 9'
      />
    </svg>
  )
}

// One icon per kind of media and per statistic, so each reads the same on
// every page. Plays are counted per kind of media and take its icon.
export const MEDIA_ICONS = {
  movie: FilmIcon,
  show: TvIcon,
  artist: MusicalNoteIcon,
  photo: PhotoIcon,
}

export const STAT_ICONS = {
  duration: ClockIcon,
  users: UsersIcon,
  requests: PlusCircleIcon,
  size: FolderIcon,
  year: CalendarDaysIcon,
  rating: StarIcon,
  rottenTomatoes: TomatoIcon,
}

type MediaType = keyof typeof MEDIA_ICONS

// Libraries have section types, single items in the activity have media types
const MEDIA_TYPES: Record<string, MediaType> = {
  movie: 'movie',
  show: 'show',
  episode: 'show',
  artist: 'artist',
  track: 'artist',
  photo: 'photo',
}

export function getMediaType(type: string): MediaType {
  return Object.hasOwn(MEDIA_TYPES, type) ? MEDIA_TYPES[type] : 'show'
}

type Props = SVGProps<SVGSVGElement> & {
  type: string
}

// Anything else, like live TV or clips, gets the TV icon
export function MediaIcon({ type, ...props }: Props) {
  const Icon = MEDIA_ICONS[getMediaType(type)]

  return <Icon {...props} />
}
