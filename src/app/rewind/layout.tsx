import CardWrapper from '@/components/CardWrapper'
import PageTitle from '@/components/PageTitle'
import { notFound } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function RewindLayout({ children }: Props) {
  return process.env.NEXT_PUBLIC_IS_REWIND_DISABLED === 'true' ? (
    notFound()
  ) : (
    <div className='w-full max-w-2xl'>
      <PageTitle />
      <CardWrapper className='min-h-[75vh]'>{children}</CardWrapper>
    </div>
  )
}
