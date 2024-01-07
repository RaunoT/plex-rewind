import CardWrapper from '@/app/_components/CardWrapper'
import PageTitle from '@/app/_components/PageTitle'
import { isDashboardDisabled } from '@/utils/config'
import { getLibraries } from '@/utils/fetchTautulli'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import DashboardNav from './_components/DashboardNav'
import PeriodSelect from './_components/PeriodSelect'

type Props = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const libraries = await getLibraries()

  isDashboardDisabled && notFound()

  return (
    <div className='flex w-full max-w-2xl flex-1 flex-col lg:max-w-7xl lg:flex-none 2xl:max-w-[90rem]'>
      <PageTitle title='Dashboard' />
      <Suspense>
        <DashboardNav libraries={libraries} />
      </Suspense>
      <CardWrapper className='my-3'>{children}</CardWrapper>
      <Suspense>
        <PeriodSelect />
      </Suspense>
    </div>
  )
}
