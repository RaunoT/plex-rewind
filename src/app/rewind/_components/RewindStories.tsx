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

export type UserRewindProps = {
  userRewind: RewindResponse
  isPaused: boolean
}

type StoryProps = {
  isPaused: boolean
}

type RewindStoriesProps = {
  userRewind: RewindResponse
}

export default function RewindStories({ userRewind }: RewindStoriesProps) {
  const stories = [
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryTotal userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 7000,
    },
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryLibraries userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 7000,
    },
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryRequests userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 8000,
    },
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryShows userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 10000,
    },
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryMovies userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 10000,
    },
    {
      type: 'component',
      component: (story: StoryProps) => (
        <StoryMusic userRewind={userRewind} isPaused={story.isPaused} />
      ),
      duration: 10000,
    },
  ]

  return (
    // TODO: Pause framer animation on story pause
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
