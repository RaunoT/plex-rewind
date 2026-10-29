'use client'

import { UserRewind } from '@/types/rewind'
import { PublicSettings } from '@/types/settings'
import { getRewindBreakdown } from '@/utils/helpers'
import { FC } from 'react'
import Snow from './Snow'
import Stories from './Stories'
import StoryAudio from './Stories/Audio'
import StoryAudioTop from './Stories/AudioTop'
import StoryFirstPlay from './Stories/FirstPlay'
import StoryGoodbye from './Stories/Goodbye'
import StoryHabitsDay from './Stories/HabitsDay'
import StoryHabitsHour from './Stories/HabitsHour'
import StoryLibraries from './Stories/Libraries'
import StoryMovies from './Stories/Movies'
import StoryMoviesActors from './Stories/MoviesActors'
import StoryMoviesDirectors from './Stories/MoviesDirectors'
import StoryMoviesTop from './Stories/MoviesTop'
import StoryRequests from './Stories/Requests'
import StoryShows from './Stories/Shows'
import StoryShowsActors from './Stories/ShowsActors'
import StoryShowsTop from './Stories/ShowsTop'
import StoryTotal from './Stories/Total'
import StoryUsersTop from './Stories/UsersTop'
import StoryWelcome from './Stories/Welcome'

type StoryComponent = {
  userRewind: UserRewind
  settings: PublicSettings
}

export type RewindMusicUrls = {
  // The top show's and top movie's theme songs, best first
  showThemes: string[]
  movieThemes: string[]
  // The admin's own track
  track: string | null
}

type Props = {
  userRewind: UserRewind
  settings: PublicSettings
  music: RewindMusicUrls
}

// Where the top show's and top movie's theme songs play
const SHOW_STORIES = ['shows', 'shows_top', 'shows_actors']
const MOVIE_STORIES = [
  'movies',
  'movies_top',
  'movies_directors',
  'movies_actors',
]

export default function RewindStories({ userRewind, settings, music }: Props) {
  function createStory(
    id: string,
    Component: FC<StoryComponent>,
    duration: number,
  ) {
    // The track also stands in for a title without a theme song
    const themes = SHOW_STORIES.includes(id)
      ? music.showThemes
      : MOVIE_STORIES.includes(id)
        ? music.movieThemes
        : []
    const sources = [...themes, music.track]

    return {
      id,
      type: 'component' as const,
      component: () => (
        <Component userRewind={userRewind} settings={settings} />
      ),
      duration,
      music: sources.filter((url) => url !== null),
    }
  }

  const isSeerrActive = settings.connection.isSeerrActive
  const isLibrariesSizeAndCountActive =
    settings.rewind.isLibrariesSizeAndCountActive
  const hasMovieLibraries = userRewind.libraries.some(
    (library) => library.section_type === 'movie',
  )
  const hasShowLibraries = userRewind.libraries.some(
    (library) => library.section_type === 'show',
  )
  const hasAudioLibraries = userRewind.libraries.some(
    (library) => library.section_type === 'artist',
  )
  // Longer with the breakdown by media type, which the story adds for 2+ types
  const hasBreakdown = getRewindBreakdown(userRewind).length > 1
  const stories = [
    createStory('welcome', StoryWelcome, 7000),
    createStory('total', StoryTotal, hasBreakdown ? 11000 : 8000),
    ...(userRewind.usersTop && userRewind.usersTop.length > 1
      ? [createStory('users_top', StoryUsersTop, 9000)]
      : []),
    ...(userRewind.libraries_total_size && isLibrariesSizeAndCountActive
      ? [createStory('libraries', StoryLibraries, 9000)]
      : []),
    ...(isSeerrActive && userRewind.requests
      ? [
          createStory(
            'requests',
            StoryRequests,
            userRewind.requests.user.total
              ? 12000
              : userRewind.requests.total
                ? 9000
                : 4000,
          ),
        ]
      : []),
    ...(userRewind.duration.user && hasShowLibraries && userRewind.shows.top[0]
      ? [
          createStory(
            'shows',
            StoryShows,
            userRewind.shows.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.shows.top.length > 1 && hasShowLibraries
      ? [createStory('shows_top', StoryShowsTop, 8000)]
      : []),
    ...(userRewind.people.showActors.length && hasShowLibraries
      ? [createStory('shows_actors', StoryShowsActors, 8000)]
      : []),
    ...(userRewind.duration.user &&
    hasMovieLibraries &&
    userRewind.movies.top[0]
      ? [
          createStory(
            'movies',
            StoryMovies,
            userRewind.movies.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.movies.top.length > 1 && hasMovieLibraries
      ? [createStory('movies_top', StoryMoviesTop, 8000)]
      : []),
    ...(userRewind.people.directors.length && hasMovieLibraries
      ? [createStory('movies_directors', StoryMoviesDirectors, 8000)]
      : []),
    ...(userRewind.people.movieActors.length && hasMovieLibraries
      ? [createStory('movies_actors', StoryMoviesActors, 8000)]
      : []),
    ...(userRewind.duration.user && hasAudioLibraries && userRewind.audio.top[0]
      ? [
          createStory(
            'audio',
            StoryAudio,
            userRewind.audio.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.audio.top.length > 1 && hasAudioLibraries
      ? [createStory('audio_top', StoryAudioTop, 8000)]
      : []),
    ...(userRewind.habits.peakDayIndex !== null
      ? [createStory('habits_day', StoryHabitsDay, 10000)]
      : []),
    ...(userRewind.habits.peakHour !== null
      ? [createStory('habits_hour', StoryHabitsHour, 10000)]
      : []),
    ...(userRewind.firstPlay
      ? [createStory('first_play', StoryFirstPlay, 10000)]
      : []),
    createStory('goodbye', StoryGoodbye, 11000),
  ]

  return (
    <>
      {settings.rewind.isSnowActive && <Snow />}
      <Stories stories={stories} />
    </>
  )
}
