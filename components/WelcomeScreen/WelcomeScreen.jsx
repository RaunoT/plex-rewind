import { motion } from 'framer-motion'
import { animateFadeIn } from '../../styles/motion'

function WelcomeScreen({ startDashboard, startRewind }) {
  return (
    <div className="text-center">
      <h1 className="flex items-center gap-4 mb-6 text-4xl font-bold">
        <motion.img
          src="/plex.svg"
          alt="Plex logo"
          className="h-12"
          initial={{ opacity: 0, translateX: '-50px' }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ duration: 0.8 }}
        />
        <motion.span
          initial={{ opacity: 0, translateX: '50px' }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ duration: 0.8 }}
        >
          Rewind
        </motion.span>
      </h1>

      {/* Get started */}
      <motion.button
        className="mx-auto mb-6 button"
        onClick={startRewind}
        variants={animateFadeIn}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8 }}
      >
        Get started
      </motion.button>

      {/* Dashboard */}
      <motion.button
        className="text-slate-300 hover:opacity-75"
        onClick={startDashboard}
        variants={animateFadeIn}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        Dashboard
      </motion.button>
    </div>
  )
}

export default WelcomeScreen
