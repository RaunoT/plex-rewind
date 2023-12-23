import DashboardNav from '@/app/dashboard/_components/DashboardNav'
import PeriodSelect from '@/app/dashboard/_components/PeriodSelect'
import CardWrapper from '@/components/Card/CardWrapper'
import PageTitle from '@/components/PageTitle'
import { isDashboardDisabled } from '@/utils/config'
import { getLibraries } from '@/utils/fetchTautulli'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

type Props = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const libraries = await getLibraries()

  isDashboardDisabled && notFound()

  return (
    <div className='w-full max-w-2xl lg:max-w-5xl'>
      <PageTitle title='Dashboard' />
      <Suspense>
        <DashboardNav libraries={libraries} />
      </Suspense>
      <CardWrapper className='lg:min-h-[572px]'>{children}</CardWrapper>
      <Suspense>
        <PeriodSelect />
      </Suspense>
    </div>
  )
}
