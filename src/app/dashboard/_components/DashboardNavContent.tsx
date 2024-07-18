'use client'

import { kebabCase } from 'lodash'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { DashboardNavProps } from './DashboardNav'

export default function DashboardNavContent({
  libraries,
  isUsersPageActive,
}: DashboardNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''

  return (
    <nav>
      <h2 className='sr-only'>Dashboard navigation</h2>
      <ul className='nav'>
        {libraries.map((library) => (
          <li key={library.section_id}>
            <Link
              href={`/dashboard/${kebabCase(library.section_name)}${period}`}
              className='nav-link'
              aria-current={
                pathname === `/dashboard/${kebabCase(library.section_name)}` &&
                'page'
              }
            >
              {library.section_name}
            </Link>
          </li>
        ))}
        {isUsersPageActive && (
          <li>
            <Link
              href={`/dashboard/users${period}`}
              className='nav-link'
              aria-current={pathname === '/dashboard/users' && 'page'}
            >
              Users
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
