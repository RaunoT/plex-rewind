'use client'

import plexSvg from '@/assets/plex.svg'
import { fadeIn } from '@/utils/motion'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'

// TODO: How do we write metadata in Next.js 13 client compos?
// export const metadata = {
//   title: 'Plex rewind',
//   description: metaDescription,
// }

export default function Page() {
  useEffect(() => {
    document.title = 'Plex rewind'
  })

  return (
    <div className='text-center'>
      <h1 className='flex items-center gap-4 mb-6 text-4xl font-bold'>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Image src={plexSvg} className='w-auto h-12' alt='Plex logo' />
        </motion.div>
        <motion.span
          variants={fadeIn}
          initial='hidden'
          animate='show'
          transition={{ delay: 0.4 }}
        >
          rewind
        </motion.span>
      </h1>

      <Link href='/rewind/totals' className='mx-auto mb-6 button'>
        Get started
      </Link>

      <Link href='/dashboard/shows' className='text-slate-300 hover:opacity-75'>
        Dashboard
      </Link>
    </div>
  )
}
