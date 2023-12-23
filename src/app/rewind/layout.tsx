import CardWrapper from '@/components/Card/CardWrapper'
import PageTitle from '@/components/PageTitle'
import { isRewindDisabled } from '@/utils/config'
import { notFound } from 'next/navigation'

type Props = {
  children: React.ReactNode
}

export default function RewindLayout({ children }: Props) {
  isRewindDisabled && notFound()

  return (
    <div className='w-full max-w-2xl'>
      <PageTitle title={`Rewind ${new Date().getFullYear()}`} />
      <CardWrapper className='lg:min-h-[80vh]'>{children}</CardWrapper>
    </div>
  )
}
