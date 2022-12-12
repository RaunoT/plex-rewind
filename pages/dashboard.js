import Dashboard from '../components/Dashboard/Dashboard'
import fetchDashboard from '../utils/fetchDashboard'

function DashboardPage({ dashboard }) {
  return <Dashboard dashboard={dashboard} />
}

export async function getStaticProps() {
  const dashboard = await fetchDashboard()

  return {
    props: {
      dashboard,
    },
    revalidate: 1800,
  }
}

export default DashboardPage
