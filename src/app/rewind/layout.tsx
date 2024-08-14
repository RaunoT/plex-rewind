import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default async function RewindLayout({ children }: Props) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (
    !settings.rewind.isActive ||
    (!session && !settings.general.isOutsideAccess)
  ) {
    return notFound()
  }

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col sm:flex-none'>
      <PageTitle title={`Rewind ${new Date().getFullYear()}`} />
      <CardWrapper className='pb-20 sm:min-h-[80vh]'>{children}</CardWrapper>
    </div>
  )
}
