'use client'

import {
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useChat } from 'ai/react'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
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
  const t = useTranslations('Chat')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isAnswerGenerating, setIsAnswerGenerating] = useState<boolean>(false)
  const messageContainerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: '/api/chat',
      body: {
        userId,
      },
      keepLastMessageOnError: true,
    })
  const PREDEFINED_QUESTIONS = [
    t('predefinedQuestions.whatDidIWatch'),
    t('predefinedQuestions.whatShowDidIWatchLastWeek'),
    t('predefinedQuestions.howManyMoviesHaveISeen'),
  ]

  function handlePredefinedQuestion(question: string) {
    handleInputChange({
      target: { value: question },
    } as ChangeEvent<HTMLInputElement>)

    // TODO: submit the form
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
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
        className='fixed inset-0 flex justify-center bg-black/75 p-4 sm:p-8 xl:items-center'
        isDismissable
      >
        <Modal className='size-full overflow-hidden xl:max-w-screen-lg 2xl:h-2/3'>
          <Dialog className='glass-sheet flex size-full flex-col'>
            {({ close }) => (
              <>
                <Button
                  onPress={close}
                  className='link-light absolute top-3 right-3 z-10 sm:top-4 sm:right-4'
                >
                  <XMarkIcon className='size-6' />
                </Button>

                <div ref={messageContainerRef} className='grow overflow-y-auto'>
                  {messages.map((m, i) => (
                    <div
                      key={m.id}
                      className={clsx(
                        'chat-reply',
                        i === 0 && 'pr-10 sm:pr-12',
                        m.role === 'user'
                          ? 'mt-5 mb-3 text-neutral-400 first:mt-0'
                          : 'rounded-xl bg-neutral-600/50 px-4 py-3',
                      )}
                    >
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ))}

                  {isSubmitting && !isAnswerGenerating && (
                    <div
                      aria-live='polite'
                      role='status'
                      className='skeleton w-3/5 lg:w-1/3'
                      aria-label='Loading response...'
                    />
                  )}

                  {messages.length === 0 && !isSubmitting && !error && (
                    <div className='text-neutral-400'>
                      <p className='mb-4'>{`${t('askMeSomething')}:`}</p>
                      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                        {PREDEFINED_QUESTIONS.map((question, index) => (
                          <button
                            key={index}
                            className='flex items-center justify-between gap-2 rounded-lg border border-neutral-600 bg-neutral-700 p-3 text-left text-sm hover:bg-neutral-600'
                            onClick={() => handlePredefinedQuestion(question)}
                          >
                            {question}
                            <QuestionMarkCircleIcon className='size-5 shrink-0' />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <p role='alert' aria-live='polite' className='text-red-500'>
                      <span className='mb-2 block'>{t('error')}</span>
                      <span className='text-xs'>{error.message}</span>
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleFormSubmit}
                  className='flex gap-2 pt-4 sm:pt-8'
                  ref={formRef}
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
                    {t('ask')}
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
