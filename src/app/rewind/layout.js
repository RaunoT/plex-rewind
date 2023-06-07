import Card from '@/components/Card'
import PageTitle from '@/components/PageTitle'

export default function RewindLayout({ children }) {
  return (
    <div className='w-full max-w-2xl'>
      <PageTitle />
      {/* TODO: Add separate Audiobooks page */}
      <Card className='min-h-[75vh]'>{children}</Card>
    </div>
  )
}
