import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { authOptions } from '@/lib/auth'
import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import DashboardNav from './_components/DashboardNav'
import DashboardProvider from './_components/DashboardProvider'
import PeriodSelect from './_components/PeriodSelect'

type Props = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const settings = getSettings()
  const session = await getServerSession(authOptions)

  if (
    !settings.dashboard.isActive ||
    (!session && !settings.general.isOutsideAccess)
  ) {
    return notFound()
  }

  const libraries = await getLibraries()

  return (
    <DashboardProvider>
      <div className='flex w-full max-w-2xl flex-1 flex-col lg:max-w-7xl lg:flex-none 2xl:max-w-[90rem]'>
        <PageTitle title='Dashboard' />
        <DashboardNav
          libraries={libraries}
          isUsersPageActive={settings.dashboard.isUsersPageActive}
        />
        <CardWrapper className='my-3 lg:min-h-[585px] 2xl:min-h-[648px]'>
          {children}
        </CardWrapper>
        <PeriodSelect settings={settings} />
      </div>
    </DashboardProvider>
  )
}
