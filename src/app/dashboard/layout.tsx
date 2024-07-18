import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { getLibraries } from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { notFound } from 'next/navigation'
import { ReactNode } from 'react'
import DashboardNav from './_components/DashboardNav'
import PeriodSelect from './_components/PeriodSelect'

type Props = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const settings = await getSettings()

  if (!settings.features.isDashboardActive) {
    return notFound()
  }

  const libraries = await getLibraries()

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col lg:max-w-7xl lg:flex-none 2xl:max-w-[90rem]'>
      <PageTitle title='Dashboard' />
      <DashboardNav
        libraries={libraries}
        isUsersPageActive={settings.features.isUsersPageActive}
      />
      <CardWrapper className='my-3 lg:min-h-[578px] 2xl:min-h-[648px]'>
        {children}
      </CardWrapper>
      <PeriodSelect settings={settings} />
    </div>
  )
}
