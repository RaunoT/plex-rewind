import { useState } from 'react'
import Dashboard from '../components/Dashboard/Dashboard'
import Rewind from '../components/Rewind/Rewind'
import WelcomeScreen from '../components/WelcomeScreen/WelcomeScreen'
import fetchDashboard from '../utils/fetchDashboard'

export default function Home({ dashboard }) {
  const [isDashboard, setIsDashboard] = useState(false)
  const [isRewind, setIsRewind] = useState(false)

  return isDashboard ? (
    <Dashboard dashboard={dashboard} returnHome={() => setIsDashboard(false)} />
  ) : isRewind ? (
    <Rewind returnHome={() => setIsRewind(false)} />
  ) : (
    <WelcomeScreen
      startDashboard={() => setIsDashboard(true)}
      startRewind={() => setIsRewind(true)}
    />
  )
}

export async function getServerSideProps() {
  const dashboard = await fetchDashboard()

  return {
    props: {
      dashboard,
    },
  }
}
