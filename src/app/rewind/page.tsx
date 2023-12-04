'use client'

import Stories from 'stories-react'
import 'stories-react/dist/index.css'
import RewindTotals from './_components/RewindTotals'

export default function Rewind() {
  const stories = [
    {
      type: 'component',
      component: RewindTotals,
    },
  ]

  return (
    <Stories
      stories={stories}
      defaultDuration={5000}
      classNames={{
        main: 'flex flex-1 flex-col !bg-transparent',
        storyContainer: '!bg-transparent flex flex-1 flex-col justify-center',
      }}
    />
  )
}
