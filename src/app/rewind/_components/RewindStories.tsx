'use client'

import { UserRewind } from '@/types'
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
} & Story

type Props = {
  userRewind: UserRewind
}

export default function RewindStories({ userRewind }: Props) {
  function createStory(Component: React.FC<StoryComponent>, duration: number) {
    return {
      type: 'component',
      component: (story: Story) => (
        <Component
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration,
    }
  }

  const stories = [
    createStory(StoryWelcome, 5000),
    createStory(StoryTotal, 8000),
    createStory(StoryLibraries, 9000),
    ...(process.env.NEXT_PUBLIC_OVERSEERR_URL
      ? [
          createStory(
            StoryRequests,

            userRewind.requests?.total ? 9000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryShows,

            userRewind.shows.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.shows.count ? [createStory(StoryShowsTop, 8000)] : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryMovies,

            userRewind.movies.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.movies.count ? [createStory(StoryMoviesTop, 8000)] : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryAudio,

            userRewind.audio.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.audio.count ? [createStory(StoryAudioTop, 8000)] : []),
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
