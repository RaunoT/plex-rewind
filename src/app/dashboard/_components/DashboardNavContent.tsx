'use client'

import TitleMenu from '@/components/TitleMenu'
import { kebabCase } from 'lodash'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { DashboardNavProps } from './DashboardNav'

export default function DashboardNavContent({
  libraries,
  isUsersPageActive,
  isMenu,
}: DashboardNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const params = new URLSearchParams(searchParams.toString())

  // The filters carry over, but another list starts from its first rows
  params.delete('limit')

  const query = params.size ? `?${params}` : ''
  const t = useTranslations('DashboardNavContent')

  if (isMenu) {
    return (
      <TitleMenu
        label={t('label')}
        items={[
          ...libraries.map((library) => ({
            href: `/dashboard/${kebabCase(library.section_name)}${query}`,
            label: library.section_name,
            isCurrent:
              pathname === `/dashboard/${kebabCase(library.section_name)}`,
          })),
          ...(isUsersPageActive
            ? [
                {
                  href: `/dashboard/users${query}`,
                  label: t('users'),
                  isCurrent: pathname === '/dashboard/users',
                },
              ]
            : []),
        ]}
      />
    )
  }

  return (
    <nav aria-label={t('label')}>
      <ul className='nav'>
        {libraries.map((library) => (
          <li key={library.section_id}>
            <Link
              href={`/dashboard/${kebabCase(library.section_name)}${query}`}
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
              href={`/dashboard/users${query}`}
              className='nav-link'
              aria-current={pathname === '/dashboard/users' && 'page'}
            >
              {t('users')}
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
