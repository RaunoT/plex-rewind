import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import getSettings from '@/utils/getSettings'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default function RewindLayout({ children }: Props) {
  const settings = getSettings()

  if (!settings.features.isRewindActive) {
    return notFound()
  }

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col sm:flex-none'>
      <PageTitle title={`Rewind ${new Date().getFullYear()}`} />
      <CardWrapper className='sm:min-h-[80vh]'>{children}</CardWrapper>
    </div>
  )
}
