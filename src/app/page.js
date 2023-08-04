import { metaDescription } from '@/utils/constants'
import Link from 'next/link'
import Title from './title'

export const metadata = {
  title: 'Plex rewind',
  description: metaDescription,
}

export default function Page() {
  return (
    <div className='text-center'>
      <Title />

      <Link href='/rewind/totals' className='mx-auto mb-6 button'>
        Get started
      </Link>

      <Link href='/dashboard/shows' className='text-slate-300 hover:opacity-75'>
        Dashboard
      </Link>
    </div>
  )
}
