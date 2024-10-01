'use client'

import { useChat } from 'ai/react'
import clsx from 'clsx'
import { Button, Dialog, DialogTrigger, Modal } from 'react-aria-components'

type Props = {
  userId: string
}

export default function TautulliAI({ userId }: Props) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
    body: {
      userId,
    },
  })

  return (
    <DialogTrigger>
      <Button className='button button-sm button--plex mx-auto mt-4'>
        Chat with AI
      </Button>
      <Modal className='fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8'>
        <Dialog className='glass-sheet m-auto w-full max-w-screen-md px-4 py-8'>
          {() => (
            <div className='mt-8 max-w-screen-md'>
              {messages.map((m) => (
                <p
                  key={m.id}
                  className={clsx(
                    'mb-2 whitespace-pre-wrap last:mb-0',
                    m.role !== 'user' && 'text-yellow-500',
                  )}
                >
                  {m.content}
                </p>
              ))}

              {messages.length === 0 && (
                <p className='text-neutral-400'>
                  Ask me something like &quot;What did I watch last week?&quot;
                  or &quot;What are my most played movies?&quot;
                </p>
              )}

              <form onSubmit={handleSubmit} className='mt-4'>
                <input
                  className='input w-full md:w-2/5'
                  value={input}
                  placeholder='Ask something...'
                  onChange={handleInputChange}
                />
              </form>
            </div>
          )}
        </Dialog>
      </Modal>
    </DialogTrigger>
  )
}
