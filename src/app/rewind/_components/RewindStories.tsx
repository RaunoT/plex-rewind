'use client'

import { ExtendedUser } from '@/utils/authOptions'
import { RewindResponse } from '@/utils/getRewind'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryLibraries from './Stories/Libraries'
import StoryMovies from './Stories/Movies'
import StoryMoviesTop from './Stories/MoviesTop'
import StoryMusic from './Stories/Music'
import StoryMusicTop from './Stories/MusicTop'
import StoryRequests from './Stories/Requests'
import StoryShows from './Stories/Shows'
import StoryShowsTop from './Stories/ShowsTop'
import StoryTotal from './Stories/Total'
import StoryWelcome from './Stories/Welcome'

export type UserRewind = {
  userRewind: RewindResponse
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type Story = {
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type Props = {
  userRewind: RewindResponse
  user: ExtendedUser
}

export default function RewindStories({ userRewind, user }: Props) {
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
    {
      type: 'component',
      component: (story: Story) => (
        <StoryTotal
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 8000,
    },
    {
      type: 'component',
      component: (story: Story) => (
        <StoryLibraries
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 9000,
    },
    ...(process.env.NEXT_PUBLIC_OVERSEERR_URL
      ? [
          {
            type: 'component',
            component: (story: Story) => (
              <StoryRequests
                userRewind={userRewind}
                isPaused={story.isPaused}
                pause={story.pause}
                resume={story.resume}
              />
            ),
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: (story: Story) => (
        <StoryShows
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 8000,
    },
    ...(userRewind.shows_total_duration
      ? [
          {
            type: 'component',
            component: (story: Story) => (
              <StoryShowsTop
                userRewind={userRewind}
                isPaused={story.isPaused}
                pause={story.pause}
                resume={story.resume}
              />
            ),
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: (story: Story) => (
        <StoryMovies
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 8000,
    },
    ...(userRewind.movies_total_duration
      ? [
          {
            type: 'component',
            component: (story: Story) => (
              <StoryMoviesTop
                userRewind={userRewind}
                isPaused={story.isPaused}
                pause={story.pause}
                resume={story.resume}
              />
            ),
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: (story: Story) => (
        <StoryMusic
          userRewind={userRewind}
          isPaused={story.isPaused}
          pause={story.pause}
          resume={story.resume}
        />
      ),
      duration: 8000,
    },
    ...(userRewind.music_total_duration
      ? [
          {
            type: 'component',
            component: (story: Story) => (
              <StoryMusicTop
                userRewind={userRewind}
                isPaused={story.isPaused}
                pause={story.pause}
                resume={story.resume}
              />
            ),
            duration: 8000,
          },
        ]
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
