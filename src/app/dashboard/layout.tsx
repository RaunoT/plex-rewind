'use client'

import DashboardNav from '@/app/dashboard/_components/DashboardNav'
import CardWrapper from '@/components/Card/CardWrapper'
import PageTitle from '@/components/PageTitle'
import PeriodSelect from '@/components/PeriodSelect'
import { notFound, usePathname } from 'next/navigation'
import { useEffect } from 'react'

type Props = {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const pathname = usePathname()

  // TODO: Maybe there's a more efficient way to accomplish this and keep this a server component
  // When a user changes the period from the bottom (e.g on mobile), scroll back to top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return process.env.NEXT_PUBLIC_IS_DASHBOARD_DISABLED === 'true' ? (
    notFound()
  ) : (
    <div className='w-full max-w-2xl lg:max-w-5xl'>
      <PageTitle title='Dashboard' />
      <DashboardNav />
      <CardWrapper className='lg:min-h-[572px]'>{children}</CardWrapper>
      <PeriodSelect />
    </div>
  )
}
