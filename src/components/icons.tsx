import {
  CalendarDaysIcon,
  CalendarIcon,
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
  firstPlay: CalendarIcon,
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
