'use client'

import CardWrapper from '@/components/CardWrapper'
import DashboardNav from '@/components/DashboardNav'
import PageTitle from '@/components/PageTitle'
import PeriodSelect from '@/components/PeriodSelect'
import { notFound, usePathname } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true' ? (
    notFound()
  ) : (
    <div className='w-full max-w-2xl lg:max-w-5xl'>
      <PageTitle title='Dashboard' />
      <DashboardNav />
      <CardWrapper className='min-h-[75vh] lg:min-h-[572px]'>
        {children}
      </CardWrapper>
      <PeriodSelect />
    </div>
  )
}
