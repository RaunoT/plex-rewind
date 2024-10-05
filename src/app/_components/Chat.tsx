'use client'

import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useChat } from 'ai/react'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogTrigger,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
import ReactMarkdown from 'react-markdown'

type Props = {
  userId: string
}

export default function Chat({ userId }: Props) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isAnswerGenerating, setIsAnswerGenerating] = useState<boolean>(false)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: '/api/chat',
      body: {
        userId,
      },
      keepLastMessageOnError: true,
    })

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    handleSubmit(e)
  }

  useEffect(() => {
    if (isLoading) {
      setIsAnswerGenerating(
        messages.length > 0 && messages[messages.length - 1].role !== 'user',
      )
    } else {
      setIsAnswerGenerating(false)
    }
  }, [messages, isLoading])

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight
    }
  }, [messages, isOpen])

  useEffect(() => {
    setIsSubmitting(isLoading)
  }, [isLoading])

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button className='link-light'>
        <ChatBubbleLeftRightIcon className='size-6' />
      </Button>
      <ModalOverlay
        className='fixed inset-0 flex justify-center bg-black/50 p-4 sm:p-8 xl:items-center'
        isDismissable
      >
        <Modal className='h-full w-full overflow-hidden xl:max-w-screen-lg 2xl:h-2/3'>
          <Dialog className='glass-sheet flex size-full flex-col'>
            {({ close }) => (
              <>
                <Button
                  onPress={close}
                  className='link-light absolute right-3 top-3 z-10'
                >
                  <XMarkIcon className='size-6' />
                </Button>

                <div
                  ref={messageContainerRef}
                  className='flex-grow overflow-y-auto'
                >
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={clsx(
                        m.role === 'user'
                          ? 'mb-3 mt-5 text-neutral-400 first:mt-0'
                          : 'rounded-xl bg-neutral-600/50 px-4 py-3',
                      )}
                    >
                      <ReactMarkdown className='chat-reply'>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ))}

                  {isSubmitting && !isAnswerGenerating && (
                    <div
                      aria-live='polite'
                      role='status'
                      className='skeleton w-1/3'
                      aria-label='Loading response...'
                    />
                  )}

                  {messages.length === 0 && !isSubmitting && !error && (
                    <p className='text-neutral-400'>
                      Ask me something like &quot;What did I watch last
                      week?&quot;
                    </p>
                  )}

                  {error && (
                    <p role='alert' aria-live='polite' className='text-red-500'>
                      <span className='mb-2 block'>Something went wrong!</span>
                      <span className='text-xs'>{error.message}</span>
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleFormSubmit}
                  className='flex gap-2 pt-4 sm:pt-8'
                >
                  <input
                    className='input w-full'
                    value={input}
                    placeholder='Type here...'
                    onChange={handleInputChange}
                    autoFocus={isOpen}
                    disabled={isSubmitting}
                  />
                  <button
                    type='submit'
                    className='button button--plex'
                    disabled={isSubmitting}
                  >
                    Ask
                  </button>
                </form>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
