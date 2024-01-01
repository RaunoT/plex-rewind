'use client'

import { ExtendedUser, RewindResponse } from '@/utils/types'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryLibraries from './Stories/Libraries'
import StoryMoviesTop from './Stories/MoviesTop'
import StoryMusicTop from './Stories/MusicTop'
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
  userRewind: RewindResponse
} & Story

function createStory(
  Component: React.FC<StoryComponent>,
  props: { userRewind: RewindResponse },
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
  userRewind: RewindResponse
  user: ExtendedUser
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
      ? [createStory(StoryRequests, commonProps, 8000)]
      : []),
    ...(userRewind.total_duration
      ? [createStory(StoryShows, commonProps, 8000)]
      : []),
    ...(userRewind.shows_total_duration
      ? [createStory(StoryShowsTop, commonProps, 8000)]
      : []),
    ...(userRewind.movies_total_duration
      ? [createStory(StoryMoviesTop, commonProps, 8000)]
      : []),
    ...(userRewind.music_total_duration
      ? [createStory(StoryMusicTop, commonProps, 8000)]
      : []),
  ]

  return (
    <Stories
      stories={stories}
      classNames={{
        main: 'flex flex-1 flex-col !bg-transparent pt-10 sm:pt-8',
        storyContainer:
          '!bg-transparent flex flex-1 flex-col sm:justify-center',
      }}
    />
  )
}
