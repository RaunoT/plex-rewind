'use client'

import CardWrapper from '@/app/_components/CardWrapper'
import { GlobalContext } from '@/app/_components/GlobalContextProvider'
import { ReactNode, useContext } from 'react'

type Props = {
  children: ReactNode
}

// Without stream details, an activity card is shorter, so the empty and error
// states are too
export default function ActivitiesCard({ children }: Props) {
  const {
    activity: { isDetailsHidden },
  } = useContext(GlobalContext)

  return (
    <CardWrapper
      className={
        isDetailsHidden
          ? 'min-h-[164px] sm:min-h-[176px]'
          : 'min-h-[252px] sm:min-h-[292px]'
      }
    >
      {children}
    </CardWrapper>
  )
}
