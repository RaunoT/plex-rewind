'use client'

import { UserRewind } from '@/types'
import { User } from 'next-auth'
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

function createStory(
  Component: React.FC<StoryComponent>,
  props: { userRewind: UserRewind },
  duration: number,
) {
  return {
    type: 'component',
    component: (story: Story) => (
      <Component
        {...props}
        isPaused={story.isPaused}
        pause={story.pause}
        resume={story.resume}
      />
    ),
    duration,
  }
}

type Props = {
  userRewind: UserRewind
  user: User
}

export default function RewindStories({ userRewind, user }: Props) {
  const commonProps = { userRewind }
  const stories = [
    {
      type: 'component',
      component: (story: Story) => (
        <StoryWelcome
          user={user}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 5000,
    },
    createStory(StoryTotal, commonProps, 8000),
    createStory(StoryLibraries, commonProps, 9000),
    ...(process.env.NEXT_PUBLIC_OVERSEERR_URL
      ? [
          createStory(
            StoryRequests,
            commonProps,
            userRewind.requests?.total ? 9000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryShows,
            commonProps,
            userRewind.shows.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.shows.count
      ? [createStory(StoryShowsTop, commonProps, 8000)]
      : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryMovies,
            commonProps,
            userRewind.movies.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.movies.count
      ? [createStory(StoryMoviesTop, commonProps, 8000)]
      : []),
    ...(userRewind.duration.user
      ? [
          createStory(
            StoryAudio,
            commonProps,
            userRewind.audio.count ? 10000 : 4000,
          ),
        ]
      : []),
    ...(userRewind.audio.count
      ? [createStory(StoryAudioTop, commonProps, 8000)]
      : []),
  ]

  return (
    <Stories
      stories={stories}
      classNames={{
        main: '!bg-transparent pt-10 sm:pt-8 flex flex-1 justify-center flex-col',
        storyContainer:
          '!bg-transparent *:sm:flex *:sm:flex-col *:sm:justify-center',
      }}
    />
  )
}
