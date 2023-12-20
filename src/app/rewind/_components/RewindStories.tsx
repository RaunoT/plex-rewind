'use client'

import { RewindResponse } from '@/utils/getRewind'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import StoryLibraries from './StoryLibraries'
import StoryMovies from './StoryMovies'
import StoryMusic from './StoryMusic'
import StoryRequests from './StoryRequests'
import StoryShows from './StoryShows'
import StoryTotal from './StoryTotal'

export type UserRewind = {
  userRewind: RewindResponse
}

export default function RewindStories({ userRewind }: UserRewind) {
  const stories = [
    {
      type: 'component',
      component: () => <StoryTotal userRewind={userRewind} />,
      duration: 7000,
    },
    {
      type: 'component',
      component: () => <StoryLibraries userRewind={userRewind} />,
      duration: 7000,
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
      duration: 10000,
    },
    {
      type: 'component',
      component: () => <StoryMovies userRewind={userRewind} />,
      duration: 10000,
    },
    {
      type: 'component',
      component: () => <StoryMusic userRewind={userRewind} />,
      duration: 10000,
    },
  ]

  return (
    <Stories
      stories={stories}
      classNames={{
        main: 'sm:flex sm:flex-1 sm:flex-col !bg-transparent pt-10 sm:pt-8',
        storyContainer:
          '!bg-transparent sm:flex sm:flex-1 sm:flex-col sm:justify-center',
      }}
    />
  )
}
