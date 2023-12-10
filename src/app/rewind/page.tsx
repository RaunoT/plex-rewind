'use client'

import { useEffect, useState } from 'react'
import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import { RewindResponse } from '../api/user/rewind/route'
import StoryLibraries from './_components/StoryLibraries'
import StoryMovies from './_components/StoryMovies'
import StoryMusic from './_components/StoryMusic'
import StoryRequests from './_components/StoryRequests'
import StoryShows from './_components/StoryShows'
import StoryTotal from './_components/StoryTotal'
import Loading from './loading'

export default function Rewind() {
  const [userRewind, setUserRewind] = useState<RewindResponse>()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/user/rewind', { cache: 'no-store' })
        const data = await res.json()
        setUserRewind(data)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  if (!userRewind) return <Loading />

  const stories = [
    {
      type: 'component',
      component: () => <StoryTotal userRewind={userRewind} />,
      duration: 5000,
    },
    {
      type: 'component',
      component: () => <StoryLibraries userRewind={userRewind} />,
      duration: 5000,
    },
    {
      type: 'component',
      component: () => <StoryRequests userRewind={userRewind} />,
      duration: 5000,
    },
    {
      type: 'component',
      component: () => <StoryShows userRewind={userRewind} />,
      duration: 5000,
    },
    {
      type: 'component',
      component: () => <StoryMovies userRewind={userRewind} />,
      duration: 5000,
    },
    {
      type: 'component',
      component: () => <StoryMusic userRewind={userRewind} />,
      duration: 5000,
    },
  ]

  return (
    <Stories
      stories={stories}
      classNames={{
        main: 'flex flex-1 flex-col !bg-transparent',
        storyContainer: '!bg-transparent flex flex-1 flex-col justify-center',
      }}
    />
  )
}
