import Dashboard from '../components/Dashboard/Dashboard'
import fetchDashboard from '../utils/fetchDashboard'

function DashboardPage({ dashboard }) {
  return <Dashboard dashboard={dashboard} />
}

export async function getServerSideProps() {
  const dashboard = await fetchDashboard()

  return {
    props: {
      dashboard,
    },
  }
}

export default DashboardPage
