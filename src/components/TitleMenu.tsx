'use client'

import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from 'react-aria-components'

export type TitleMenuItem = {
  href: string
  label: string
  icon?: ReactNode
  isCurrent: boolean
  isDisabled?: boolean
}

type Props = {
  label: string
  items: TitleMenuItem[]
}

// On phones the page title doubles as the page's navigation, in place of tabs
export default function TitleMenu({ label, items }: Props) {
  const router = useRouter()
  const current = items.find((item) => item.isCurrent)

  return (
    <MenuTrigger>
      <Button className='focus-visible:focus-ring -mx-1.5 flex min-w-0 items-center gap-1 rounded-lg px-1.5 text-lg font-semibold tracking-tight sm:text-xl'>
        <span className='truncate'>{current?.label}</span>
        <ChevronDownIcon className='size-4 shrink-0 text-neutral-400' />
      </Button>
      <Popover
        placement='bottom start'
        offset={8}
        className='glass-sheet w-56 rounded-[18px] bg-neutral-900/70 p-1.5 outline-none'
      >
        <Menu
          aria-label={label}
          className='outline-none'
          disabledKeys={items
            .filter((item) => item.isDisabled)
            .map((item) => item.href)}
          onAction={(href) => router.push(String(href))}
        >
          {items.map((item) => (
            <MenuItem
              key={item.href}
              id={item.href}
              textValue={item.label}
              className='menu-item data-disabled:cursor-not-allowed data-disabled:opacity-50'
            >
              {item.icon}
              <span className='truncate'>{item.label}</span>
              {item.isCurrent && <CheckIcon className='ml-auto size-4!' />}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  )
}
