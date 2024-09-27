'use client'

import { UserRewind } from '@/types/rewind'
import { Settings } from '@/types/settings'
import { FC } from 'react'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryAudio from './Stories/Audio'
import StoryAudioTop from './Stories/AudioTop'
import StoryGoodbye from './Stories/Goodbye'
import StoryLibraries from './Stories/Libraries'
import StoryMovies from './Stories/Movies'
import StoryMoviesTop from './Stories/MoviesTop'
import StoryRequests from './Stories/Requests'
import StoryShows from './Stories/Shows'
import StoryShowsTop from './Stories/ShowsTop'
import StoryTotal from './Stories/Total'
import StoryWelcome from './Stories/Welcome'

type Story = {
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type StoryComponent = {
  userRewind: UserRewind
  settings: Settings
} & Story

type Props = {
  userRewind: UserRewind
  settings: Settings
}

export default function RewindStories({ userRewind, settings }: Props) {
  function createStory(Component: FC<StoryComponent>, duration: number) {
    return {
      type: 'component',
      component: (story: Story) => (
        <Component
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
          settings={settings}
        />
      ),
      duration,
    }
  }

  const isOverseerrActive =
    settings.connection.overseerrUrl && settings.connection.overseerrApiKey
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
    createStory(StoryWelcome, 7000),
    createStory(StoryTotal, 8000),
    ...(userRewind.libraries_total_size && isLibrariesSizeAndCountActive
      ? [createStory(StoryLibraries, 9000)]
      : []),
    ...(isOverseerrActive
      ? [createStory(StoryRequests, userRewind.requests?.total ? 9000 : 4000)]
      : []),
    ...(userRewind.duration.user && hasShowLibraries && userRewind.shows.top[0]
      ? [createStory(StoryShows, userRewind.shows.count ? 10000 : 4000)]
      : []),
    ...(userRewind.shows.top.length > 1 && hasShowLibraries
      ? [createStory(StoryShowsTop, 8000)]
      : []),
    ...(userRewind.duration.user &&
    hasMovieLibraries &&
    userRewind.movies.top[0]
      ? [createStory(StoryMovies, userRewind.movies.count ? 10000 : 4000)]
      : []),
    ...(userRewind.movies.top.length > 1 && hasMovieLibraries
      ? [createStory(StoryMoviesTop, 8000)]
      : []),
    ...(userRewind.duration.user && hasAudioLibraries && userRewind.audio.top[0]
      ? [createStory(StoryAudio, userRewind.audio.count ? 10000 : 4000)]
      : []),
    ...(userRewind.audio.top.length > 1 && hasAudioLibraries
      ? [createStory(StoryAudioTop, 8000)]
      : []),
    createStory(StoryGoodbye, 11000),
  ]

  return (
    <Stories
      stories={stories}
      classNames={{
        main: '!bg-transparent pt-10 sm:pt-8 flex flex-1 sm:justify-center sm:flex-col',
        storyContainer: '!bg-transparent',
      }}
    />
  )
}
