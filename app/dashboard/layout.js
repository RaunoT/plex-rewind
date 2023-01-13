'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Card from '../../ui/Card'
import PageTitle from '../../ui/PageTitle'

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="w-full max-w-2xl xl:max-w-5xl">
      <PageTitle title="Dashboard" />
      <Card className="xl:min-h-[564px]">{children}</Card>
    </div>
  )
}
