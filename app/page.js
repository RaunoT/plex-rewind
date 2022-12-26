// FIXME: Remove this
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { animateFadeIn } from '../utils/motion'

export default function Page() {
  return (
    <div className="text-center">
      <h1 className="flex items-center gap-4 mb-6 text-4xl font-bold">
        <motion.img
          src="/plex.svg"
          alt="Plex logo"
          className="h-12"
          initial={{ opacity: 0, translateY: '-50px' }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{
            type: 'spring',
            bounce: 0.5,
            delay: 0.7,
          }}
        />
        <motion.span
          initial={{ opacity: 0, translateX: '50px' }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ duration: 0.7 }}
        >
          Rewind
        </motion.span>
      </h1>

      {/* TODO: Maybe we can pass <Link /> to <motion /> already */}
      <motion.div
        variants={animateFadeIn}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8 }}
      >
        <Link href="/rewind/total" className="mx-auto mb-6 button">
          Get started
        </Link>
      </motion.div>

      {/* TODO: Maybe we can pass <Link /> to <motion /> already */}
      <motion.div
        variants={animateFadeIn}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Link
          href="/dashboard/shows"
          className="text-slate-300 hover:opacity-75"
        >
          Dashboard
        </Link>
      </motion.div>
    </div>
  )
}