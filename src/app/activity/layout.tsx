import { ReactNode } from 'react'
import PageTitle from '../_components/PageTitle'

type Props = {
  children: ReactNode
}

export default function ActivityLayout({ children }: Props) {
  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col sm:flex-none'>
      <PageTitle title='Activity' />
      {children}
    </div>
  )
}
