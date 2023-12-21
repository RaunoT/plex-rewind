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
}

export default function RewindStories({ userRewind }: UserRewind) {
  const stories = [
    {
      type: 'component',
      component: () => <StoryTotal userRewind={userRewind} />,
      duration: 8000,
    },
    {
      type: 'component',
      component: () => <StoryLibraries userRewind={userRewind} />,
      duration: 9000,
    },
    ...(process.env.NEXT_PUBLIC_OVERSEERR_URL
      ? [
          {
            type: 'component',
            component: () => <StoryRequests userRewind={userRewind} />,
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: () => <StoryShows userRewind={userRewind} />,
      duration: 8000,
    },
    ...(userRewind.shows_total_duration
      ? [
          {
            type: 'component',
            component: () => <StoryShowsTop userRewind={userRewind} />,
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: () => <StoryMovies userRewind={userRewind} />,
      duration: 8000,
    },
    ...(userRewind.movies_total_duration
      ? [
          {
            type: 'component',
            component: () => <StoryMoviesTop userRewind={userRewind} />,
            duration: 8000,
          },
        ]
      : []),
    {
      type: 'component',
      component: () => <StoryMusic userRewind={userRewind} />,
      duration: 8000,
    },
    ...(userRewind.music_total_duration
      ? [
          {
            type: 'component',
            component: () => <StoryMusicTop userRewind={userRewind} />,
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
