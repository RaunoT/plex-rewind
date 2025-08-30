import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { authOptions } from '@/lib/auth'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export default async function RewindLayout({ children }: Props) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)
  const t = await getTranslations('Rewind')

  if (
    !settings.rewind.isActive ||
    (!session && !settings.general.isOutsideAccess)
  ) {
    return notFound()
  }

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col sm:flex-none'>
      <PageTitle title={t('pageTitle')} />
      <CardWrapper className='pb-16 sm:min-h-[80vh]'>{children}</CardWrapper>
    </div>
  )
}
