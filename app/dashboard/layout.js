import PageTitle from '../../components/PageTitle/PageTitle'

function DashboardLayout({ children }) {
  return (
    <div className="w-full max-w-2xl">
      <PageTitle title="Dashboard" subtitle="last 30 days" />
      <article className="px-6 sm:px-8 pt-8 pb-3 sm:pb-5 rounded-3xl w-full min-h-[75vh] flex flex-col bg-gradient">
        {children}
      </article>
    </div>
  )
}

export default DashboardLayout
