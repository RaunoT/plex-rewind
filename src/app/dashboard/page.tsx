import { getLibraries } from '@/utils/fetchTautulli'
import { snakeCase } from 'lodash'
import { notFound, redirect } from 'next/navigation'

export default async function Page() {
  const libraries = await getLibraries()

  // TODO: dashboard link straight to first library
  if (libraries) {
    redirect(`/dashboard/${snakeCase(libraries[0].section_name)}`)
  } else {
    notFound()
  }
}
