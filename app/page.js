'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { fadeIn } from '../utils/motion'

export default function Page() {
  return (
    <div className='text-center'>
      <h1 className='flex items-center gap-4 mb-6 text-4xl font-bold'>
        <motion.img
          src='/plex.svg'
          alt='Plex logo'
          className='h-12'
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
        />
        <motion.span
          variants={fadeIn}
          initial='hidden'
          animate='show'
          transition={{ delay: 0.4 }}
        >
          rewind
        </motion.span>
      </h1>

      <Link href='/rewind/total' className='mx-auto mb-6 button'>
        Get started
      </Link>

      <Link href='/dashboard/shows' className='text-slate-300 hover:opacity-75'>
        Dashboard
      </Link>
    </div>
  )
}
