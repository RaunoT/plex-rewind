import { useState } from 'react'
import Dashboard from '../components/Dashboard/Dashboard'
import Rewind from '../components/Rewind/Rewind'
import WelcomeScreen from '../components/WelcomeScreen/WelcomeScreen'
import fetchDashboard from '../utils/fetchDashboard'
import fetchRewind from '../utils/fetchRewind'

export default function Home({ dashboard, rewind }) {
  const [isDashboard, setIsDashboard] = useState(false)
  const [isRewind, setIsRewind] = useState(false)

  return isDashboard ? (
    <Dashboard dashboard={dashboard} returnHome={() => setIsDashboard(false)} />
  ) : isRewind ? (
    <Rewind rewind={rewind} returnHome={() => setIsRewind(false)} />
  ) : (
    <WelcomeScreen
      startDashboard={() => setIsDashboard(true)}
      startRewind={() => setIsRewind(true)}
    />
  )
}

export async function getServerSideProps() {
  const dashboard = await fetchDashboard()
  const rewind = await fetchRewind(8898770)

  return {
    props: {
      dashboard,
      rewind,
    },
  }
}
