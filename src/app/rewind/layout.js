import Card from '@/components/Card'
import PageTitle from '@/components/PageTitle'
import { notFound } from 'next/navigation'

export default function RewindLayout({ children }) {
  return process.env.NEXT_PUBLIC_IS_REWIND_DISABLED ? (
    notFound()
  ) : (
    <div className='w-full max-w-2xl'>
      <PageTitle />
      <Card className='min-h-[75vh]'>{children}</Card>
    </div>
  )
}
