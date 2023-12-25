'use client'

import { RewindResponse } from '@/utils/getRewind'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryLibraries from './StoryLibraries'
import StoryMovies from './StoryMovies'
import StoryMoviesTop from './StoryMoviesTop'
import StoryMusic from './StoryMusic'
import StoryMusicTop from './StoryMusicTop'
import StoryRequests from './StoryRequests'
import StoryShows from './StoryShows'
import StoryShowsTop from './StoryShowsTop'
import StoryTotal from './StoryTotal'

export type UserRewind = {
  userRewind: RewindResponse
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type StoryProps = {
  isPaused: boolean
  pause: () => void
  resume: () => void
}

type Props = {
  userRewind: RewindResponse
}

export default function RewindStories({ userRewind }: Props) {
  const stories = [
    {
      type: 'component',
      component: (story: StoryProps) => (
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
      component: (story: StoryProps) => (
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
            component: (story: StoryProps) => (
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
      component: (story: StoryProps) => (
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
            component: (story: StoryProps) => (
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
      component: (story: StoryProps) => (
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
            component: (story: StoryProps) => (
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
      component: (story: StoryProps) => (
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
            component: (story: StoryProps) => (
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
