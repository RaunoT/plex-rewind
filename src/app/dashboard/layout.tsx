import CardWrapper from "@/app/_components/CardWrapper"
import PageTitle from "@/app/_components/PageTitle"
import { isDashboardDisabled } from "@/utils/config"
import { getLibraries } from "@/utils/fetchTautulli"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import DashboardNav from "./_components/DashboardNav"
import PeriodSelect from "./_components/PeriodSelect"

type Props = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: Props) {
  const libraries = await getLibraries()

  isDashboardDisabled && notFound()

  return (
    <div className='w-full max-w-2xl lg:max-w-5xl 2xl:max-w-6xl'>
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
