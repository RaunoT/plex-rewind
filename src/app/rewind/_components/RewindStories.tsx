'use client'

import { Settings, UserRewind } from '@/types'
import { FC } from 'react'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryAudio from './Stories/Audio'
import StoryAudioTop from './Stories/AudioTop'
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
  const isRewindLibrariesSizeAndCountActive =
    settings.features.isRewindLibrariesSizeAndCountActive
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
    createStory(StoryWelcome, 5000),
    createStory(StoryTotal, 8000),
    ...(userRewind.libraries_total_size && isRewindLibrariesSizeAndCountActive
      ? [createStory(StoryLibraries, 9000)]
      : []),
    ...(isOverseerrActive
      ? [createStory(StoryRequests, userRewind.requests?.total ? 9000 : 4000)]
      : []),
    ...(userRewind.duration.user && hasShowLibraries
      ? [createStory(StoryShows, userRewind.shows.count ? 10000 : 4000)]
      : []),
    ...(userRewind.shows.count && hasShowLibraries
      ? [createStory(StoryShowsTop, 8000)]
      : []),
    ...(userRewind.duration.user && hasMovieLibraries
      ? [createStory(StoryMovies, userRewind.movies.count ? 10000 : 4000)]
      : []),
    ...(userRewind.movies.count && hasMovieLibraries
      ? [createStory(StoryMoviesTop, 8000)]
      : []),
    ...(userRewind.duration.user && hasAudioLibraries
      ? [createStory(StoryAudio, userRewind.audio.count ? 10000 : 4000)]
      : []),
    ...(userRewind.audio.count && hasAudioLibraries
      ? [createStory(StoryAudioTop, 8000)]
      : []),
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
