import fetchDashboard from '../../utils/fetchDashboard'

export default async function handler(req, res) {
  const dashboard = await fetchDashboard()
  res.status(200).json(dashboard)
}
