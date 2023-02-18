'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Card from '../../ui/Card'
import DashboardNav from '../../ui/DashboardNav'
import PageTitle from '../../ui/PageTitle'
import PeriodSelect from '../../ui/PeriodSelect'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className='w-full max-w-2xl xl:max-w-5xl'>
      <PageTitle title='Dashboard' />
      <DashboardNav />
      {/* TODO: Add separate Audiobooks page */}
      <Card className='xl:min-h-[572px]'>{children}</Card>
      <PeriodSelect />
    </div>
  )
}
