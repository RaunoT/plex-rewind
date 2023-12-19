'use client'

import { Library } from '@/utils/fetchTautulli'
import { snakeCase } from 'lodash'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type Props = {
  libraries: Library[]
}

export default function DashboardNav({ libraries }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''
  console.log(libraries)

  return (
    <nav>
      <ul className='-mt-2 mb-2 flex items-center justify-center gap-4 text-xs font-medium uppercase text-neutral-200 sm:text-base'>
        {libraries.map((library) => (
          <li key={library.section_id}>
            <Link
              href={`/dashboard/${snakeCase(library.section_name)}${period}`}
              className='nav-link'
              aria-current={
                pathname === `/dashboard/${snakeCase(library.section_name)}` &&
                'page'
              }
            >
              {library.section_name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={`/dashboard/users${period}`}
            className='nav-link'
            aria-current={pathname === '/dashboard/users' && 'page'}
          >
            Users
          </Link>
        </li>
      </ul>
    </nav>
  )
}
