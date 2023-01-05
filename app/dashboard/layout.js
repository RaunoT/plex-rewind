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
      {/* TODO: Add filter for day count */}
      <PageTitle title="Dashboard" subtitle="last 30 days" />
      <Card className="xl:min-h-0">{children}</Card>
    </div>
  )
}
