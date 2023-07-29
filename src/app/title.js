'use client'

import plexSvg from '@/assets/plex.svg'
import { fadeIn } from '@/utils/motion'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function Title() {
  return (
    <h1 className='flex items-center gap-4 mb-6 text-4xl font-bold'>
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Image src={plexSvg} className='w-auto h-12' alt='Plex logo' priority />
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
  )
}
