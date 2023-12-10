'use client'

import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import { RewindResponse } from '../page'
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
    {
      type: 'component',
      component: () => <StoryRequests userRewind={userRewind} />,
      duration: 8000,
    },
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
    // TODO: Pause framer animation on story pause
    <Stories
      stories={stories}
      classNames={{
        main: 'flex flex-1 flex-col !bg-transparent pt-8',
        storyContainer: '!bg-transparent flex flex-1 flex-col justify-center',
      }}
    />
  )
}
