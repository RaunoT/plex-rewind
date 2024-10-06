import getSettings from '@/utils/getSettings'
import { HISTORY_PATH, saveTautulliHistory } from '@/utils/history'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  FileState,
  GoogleAICacheManager,
  GoogleAIFileManager,
} from '@google/generative-ai/server'
import { convertToCoreMessages, streamText } from 'ai'

const CACHE_TTL = 60 * 60 // 1 hour
const MODEL = 'models/gemini-1.5-flash-001'

async function uploadHistoryFile(apiKey: string) {
  const fileManager = new GoogleAIFileManager(apiKey)
  const fileResult = await fileManager.uploadFile(HISTORY_PATH, {
    displayName: 'Plex viewing history',
    mimeType: 'text/plain',
  })
  const { name } = fileResult.file

  let file = await fileManager.getFile(name)

  while (file.state === FileState.PROCESSING) {
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    file = await fileManager.getFile(name)
  }

  return fileResult
}

export async function POST(req: Request) {
  const { messages, userId } = await req.json()
  const settings = getSettings()
  const startDate = settings.chat.startDate || ''
  const endDate = settings.chat.endDate || ''
  const apiKey = settings.connection.aiApiKey
  const google = createGoogleGenerativeAI({
    apiKey,
  })

  await saveTautulliHistory(settings)

  const historyFile = await uploadHistoryFile(apiKey!)
  const cacheManager = new GoogleAICacheManager(apiKey!)
  const { name: cachedContent } = await cacheManager.create({
    model: MODEL,
    systemInstruction:
      `You're an AI assistant for a Plex server, using history from the Tautulli API as context.\n` +
      `Your primary function is to answer questions about the Plex library, viewing habits and history.\n` +
      `Do not provide answers to questions that are not related to the Plex server or its media content.\n` +
      `The user asking the questions ${userId ? `has the userId ${userId}.` : 'is unknown.'}\n` +
      `Try to keep the response concise and to the point.\n` +
      `Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.\n` +
      `The history provided is from ${startDate || 'the beginning of time'} to ${endDate || 'today'}.\n` +
      `The Plex viewing history from the Tautulli API is in the file you have access to.\n`,
    contents: [
      {
        role: 'user',
        parts: [
          {
            fileData: {
              mimeType: historyFile.file.mimeType,
              fileUri: historyFile.file.uri,
            },
          },
        ],
      },
    ],
    ttlSeconds: CACHE_TTL,
  })

  try {
    const result = await streamText({
      model: google(MODEL, { cachedContent }),
      messages: convertToCoreMessages(messages),
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[CHAT] - Error generating response!', error)

    return new Response(error as string, { status: 500 })
  }
}
