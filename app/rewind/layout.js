import Card from '../../ui/Card'
import PageTitle from '../../ui/PageTitle'

export default function RewindLayout({ children }) {
  return (
    <div className='w-full max-w-2xl'>
      <PageTitle />
      {/* TODO: Separate Audiobooks page */}
      <Card className='min-h-[75vh]'>{children}</Card>
    </div>
  )
}
