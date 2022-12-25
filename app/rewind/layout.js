import PageTitle from '../../ui/PageTitle'

function RewindLayout({ children }) {
  return (
    <div className="w-full max-w-2xl">
      <PageTitle />

      {children}
    </div>
  )
}

export default DashboardLayout
