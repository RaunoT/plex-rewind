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
    <ul className="flex items-center justify-center gap-4 mb-2 -mt-2 text-xs font-medium uppercase sm:text-base text-neutral-200">
      {/* TODO: Don't allow hover on already selected items */}
      <li>
        <Link
          href={`/dashboard/shows${period}`}
          className="transition aria-selected:text-teal-300 hover:opacity-75"
          aria-selected={pathname === '/dashboard/shows'}
        >
          Shows
        </Link>
      </li>
      <li>
        <Link
          href={`/dashboard/movies${period}`}
          className="transition aria-selected:text-teal-300 hover:opacity-75"
          aria-selected={pathname === '/dashboard/movies'}
        >
          Movies
        </Link>
      </li>
      <li>
        <Link
          href={`/dashboard/audio${period}`}
          className="transition aria-selected:text-teal-300 hover:opacity-75"
          aria-selected={pathname === '/dashboard/audio'}
        >
          Audio
        </Link>
      </li>
      <li>
        <Link
          href={`/dashboard/users${period}`}
          className="transition aria-selected:text-teal-300 hover:opacity-75"
          aria-selected={pathname === '/dashboard/users'}
        >
          Users
        </Link>
      </li>
    </ul>
  )
}
