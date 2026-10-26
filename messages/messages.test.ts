import { LOCALES } from '@/utils/constants'
import fs from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

type Messages = { [key: string]: string | Messages }

function loadMessages(locale: string): Messages {
  const file = path.join(import.meta.dirname, `${locale}.json`)

  return JSON.parse(fs.readFileSync(file, 'utf-8'))
}

function flatten(messages: Messages, prefix = ''): Record<string, string> {
  return Object.entries(messages).reduce<Record<string, string>>(
    (result, [key, value]) => {
      const id = prefix ? `${prefix}.${key}` : key

      return typeof value === 'string'
        ? { ...result, [id]: value }
        : { ...result, ...flatten(value, id) }
    },
    {},
  )
}

// Collects argument names and rich-text tags (`{count}`, `<b>`). A minimal ICU
// walk is needed so plural/select branch bodies like `other {Movies}` aren't
// mistaken for arguments.
function placeholders(message: string): string[] {
  const found = new Set<string>()

  let i = 0

  function readUntil(stops: string): string {
    const start = i

    while (i < message.length && !stops.includes(message[i])) {
      i++
    }

    return message.slice(start, i).trim()
  }

  function parseArgument() {
    i++ // {

    const name = readUntil(',}')

    found.add(name)

    if (message[i] === '}') {
      i++

      return
    }

    i++ // ,

    const type = readUntil(',}')

    if (!['plural', 'select', 'selectordinal'].includes(type)) {
      readUntil('}')
      i++

      return
    }

    i++ // ,

    while (i < message.length && message[i] !== '}') {
      readUntil('{')
      i++ // {
      parseMessage()
      i++ // }
      readUntil('{}')
    }

    i++ // }
  }

  function parseMessage() {
    while (i < message.length && message[i] !== '}') {
      if (message[i] === '{') {
        parseArgument()
      } else {
        const tag = message.slice(i).match(/^<\/?([a-zA-Z]\w*)>/)

        if (tag) {
          found.add(`<${tag[1]}>`)
          i += tag[0].length
        } else {
          i++
        }
      }
    }
  }

  parseMessage()

  return [...found].sort()
}

const reference = flatten(loadMessages('en'))

describe.each(LOCALES.filter((locale) => locale !== 'en'))(
  'messages/%s.json',
  (locale) => {
    const messages = flatten(loadMessages(locale))

    it('has the same keys as en.json', () => {
      expect(Object.keys(messages).sort()).toEqual(
        Object.keys(reference).sort(),
      )
    })

    it('uses the same placeholders and tags as en.json', () => {
      for (const [key, message] of Object.entries(messages)) {
        expect(placeholders(message), key).toEqual(
          placeholders(reference[key] ?? ''),
        )
      }
    })
  },
)
