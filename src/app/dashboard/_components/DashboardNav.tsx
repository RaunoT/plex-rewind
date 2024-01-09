'use client'

import { Library } from '@/types'
import { isDashboardUsersDisabled } from '@/utils/config'
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

  return (
    <nav>
      <ul className='nav'>
        {libraries.map((library) => (
          <li key={library.section_id}>
            <Link
              href={`/dashboard/${snakeCase(library.section_name)}${period}`}
              className='link'
              aria-current={
                pathname === `/dashboard/${snakeCase(library.section_name)}` &&
                'page'
              }
            >
              {library.section_name}
            </Link>
          </li>
        ))}
        {!isDashboardUsersDisabled && (
          <li>
            <Link
              href={`/dashboard/users${period}`}
              className='link'
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
