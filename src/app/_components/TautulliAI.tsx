'use client'

import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useChat } from 'ai/react'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, Dialog, DialogTrigger, Modal } from 'react-aria-components'
import ReactMarkdown from 'react-markdown'

type Props = {
  userId: string
}

export default function TautulliAI({ userId }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat',
      body: {
        userId,
      },
    })

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className='link-light'>
        <ChatBubbleLeftRightIcon className='size-6' />
      </Button>
      <Modal className='fixed inset-0 flex items-center justify-center bg-black/50 p-4 sm:p-8'>
        <Dialog className='glass-sheet flex h-full w-full flex-col overflow-hidden xl:max-w-screen-md'>
          {({ close }) => (
            <>
              <Button
                onPress={close}
                className='link-light absolute right-3 top-3 z-10'
              >
                <XMarkIcon className='size-6' />
              </Button>

              <div className='flex-grow overflow-y-auto pr-6 sm:pr-12'>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx(
                      'mb-2 last:mb-0',
                      m.role === 'user' && 'text-neutral-400',
                    )}
                  >
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ))}

                {isLoading && (
                  <div
                    aria-live='polite'
                    role='status'
                    className='animate-pulse'
                    aria-label='Loading response...'
                  >
                    ...
                  </div>
                )}

                {messages.length === 0 && !isLoading && (
                  <p className='text-neutral-400'>
                    Ask me something like &quot;What did I watch last
                    week?&quot;
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className='pt-4 sm:pt-8'>
                <input
                  className='input w-full'
                  value={input}
                  placeholder='Type here...'
                  onChange={handleInputChange}
                  autoFocus={isOpen}
                  disabled={isLoading}
                />
              </form>
            </>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  )
}
