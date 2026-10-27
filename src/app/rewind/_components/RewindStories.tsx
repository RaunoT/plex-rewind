'use client'

import { UserRewind } from '@/types/rewind'
import { PublicSettings } from '@/types/settings'
import { FC } from 'react'
import Stories from './Stories'
import StoryAudio from './Stories/Audio'
import StoryAudioTop from './Stories/AudioTop'
import StoryGoodbye from './Stories/Goodbye'
import StoryHabitsDay from './Stories/HabitsDay'
import StoryHabitsHour from './Stories/HabitsHour'
import StoryLibraries from './Stories/Libraries'
import StoryMovies from './Stories/Movies'
import StoryMoviesTop from './Stories/MoviesTop'
import StoryRequests from './Stories/Requests'
import StoryShows from './Stories/Shows'
import StoryShowsTop from './Stories/ShowsTop'
import StoryTotal from './Stories/Total'
import StoryUsersTop from './Stories/UsersTop'
import StoryWelcome from './Stories/Welcome'

type Story = {
  pause: () => void
  resume: () => void
}

type StoryComponent = {
  userRewind: UserRewind
  settings: PublicSettings
} & Story

type Props = {
  userRewind: UserRewind
  settings: PublicSettings
}

export default function RewindStories({ userRewind, settings }: Props) {
  function createStory(
    id: string,
    Component: FC<StoryComponent>,
    duration: number,
  ) {
    return {
      id,
      type: 'component' as const,
      component: (story: Story) => (
        <Component
          userRewind={userRewind}
          pause={story.pause}
          resume={story.resume}
          settings={settings}
        />
      ),
      duration,
    }
  }

  const isOverseerrActive = settings.connection.isOverseerrActive
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
  const stories = [
    createStory('welcome', StoryWelcome, 7000),
    createStory('total', StoryTotal, 8000),
    ...(userRewind.usersTop && userRewind.usersTop.length > 1
      ? [createStory('users_top', StoryUsersTop, 9000)]
      : []),
    ...(userRewind.libraries_total_size && isLibrariesSizeAndCountActive
      ? [createStory('libraries', StoryLibraries, 9000)]
      : []),
    ...(isOverseerrActive && userRewind.requests
      ? [
          createStory(
            'requests',
            StoryRequests,
            userRewind.requests.total ? 9000 : 4000,
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
    createStory('goodbye', StoryGoodbye, 11000),
  ]

  return <Stories stories={stories} />
}
