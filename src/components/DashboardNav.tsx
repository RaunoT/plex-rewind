'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

export default function DashboardNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get('period')
    ? '?period=' + searchParams.get('period')
    : ''

  return (
    <nav>
      <ul className='-mt-2 mb-2 flex items-center justify-center gap-4 text-xs font-medium uppercase text-neutral-200 sm:text-base'>
        <li>
          <Link
            href={`/dashboard/shows${period}`}
            className='nav-link'
            aria-current={pathname === '/dashboard/shows' && 'page'}
          >
            Shows
          </Link>
        </li>
        <li>
          <Link
            href={`/dashboard/movies${period}`}
            className='nav-link'
            aria-current={pathname === '/dashboard/movies' && 'page'}
          >
            Movies
          </Link>
        </li>
        <li>
          <Link
            href={`/dashboard/music${period}`}
            className='nav-link'
            aria-current={pathname === '/dashboard/music' && 'page'}
          >
            Music
          </Link>
        </li>
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
