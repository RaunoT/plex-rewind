import Card from '../../ui/Card'
import PageTitle from '../../ui/PageTitle'

export default function DashboardLayout({ children }) {
  return (
    <div className="w-full max-w-2xl xl:max-w-5xl">
      <PageTitle title="Dashboard" subtitle="last 30 days" />
      <Card className="xl:min-h-0">{children}</Card>
    </div>
  )
}
