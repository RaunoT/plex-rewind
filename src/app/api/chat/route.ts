import { Settings } from '@/types/settings'
import { TautulliItemRow } from '@/types/tautulli'
import fetchTautulli from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
import getSettings from '@/utils/getSettings'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { GoogleAICacheManager } from '@google/generative-ai/server'
import { convertToCoreMessages, streamText } from 'ai'
import fs from 'fs'
import path from 'path'

// const MAX_INPUT_TOKENS = 1024
// const MAX_OUTPUT_TOKENS = 128000

export async function POST(req: Request) {
  const { messages, userId } = await req.json()
  const settings = getSettings()
  // https://aistudio.google.com/app/apikey
  const apiKey = settings.connection.aiApiKey
  // https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai
  const google = createGoogleGenerativeAI({
    apiKey,
  })
  const model = 'models/gemini-1.5-flash-001'
  const context = await getContext(userId, settings)
  // https://ai.google.dev/api/caching
  // https://ai.google.dev/gemini-api/docs/caching?lang=node
  const cacheManager = new GoogleAICacheManager(apiKey!)
  const { name: cachedContent } = await cacheManager.create({
    model,
    contents: [
      {
        role: 'user',
        parts: [{ text: context }],
      },
    ],
    ttlSeconds: 60 * 60, // 1 hour,
  })

  try {
    const result = await streamText({
      model: google(model, { cachedContent }),
      messages: convertToCoreMessages(messages),
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('[AI] - Error generating response!', error)

    return new Response(error as string, { status: 500 })
  }
}

async function getContext(userId: string, settings: Settings): Promise<string> {
  const contextFilePath = path.join(process.cwd(), 'config/ai-context.txt')

  let newFile = false

  if (!fs.existsSync(contextFilePath)) {
    fs.writeFileSync(contextFilePath, 'Initial context', 'utf-8')
    newFile = true
  }

  try {
    const stats = fs.statSync(contextFilePath)
    const fileAge = Date.now() - stats.mtimeMs

    if (fileAge < 3600000 && !newFile) {
      // Less than 1 hour old
      return fs.readFileSync(contextFilePath, 'utf-8')
    }
  } catch (error) {
    console.error('[AI] - Error reading history file!', error)
  }

  // If the file is older than 1 hour, fetch new data
  const startDate = settings.chat.startDate || ''
  const endDate = settings.chat.endDate || ''
  const historyData = await fetchTautulli<{ data: TautulliItemRow[] }>(
    'get_history',
    {
      length: -1,
      after: startDate,
      before: endDate,
    },
    false,
  )
  const history = historyData?.response?.data.data
  const formattedHistory = formatHistory(history)
  const context =
    `You are an AI assistant for a Plex server, using history from the Tautulli API as context.\n` +
    `Your primary function is to answer questions about the Plex library, viewing habits and history.\n` +
    `Do not provide answers to questions that are not related to the Plex server or its media content.\n` +
    `The user asking the questions ${userId ? `has the userId ${userId}.` : 'is unknown.'}\n` +
    `Try to keep the response concise and to the point.\n` +
    `Today is ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.\n` +
    `The history provided is from ${startDate} to ${endDate}. Let the user know that this can be changed from Rewind settings.\n` +
    `The Plex viewing history from the Tautulli API is as follows:\n` +
    `${formattedHistory}`
  // const truncatedContext = truncateContext(context)

  // fs.writeFileSync(contextFilePath, truncatedContext, 'utf-8')
  fs.writeFileSync(contextFilePath, context, 'utf-8')

  return context
}

function formatHistory(history: TautulliItemRow[] | undefined): string {
  if (!history?.length) return 'No recent viewing history available.'

  return history
    .map(
      (item: TautulliItemRow) => `
  - ${item.full_title} (${item.year})
    Viewer: ${item.friendly_name} (ID: ${item.user_id})
    Date: ${new Date(item.date * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
    Start: ${new Date(item.started * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    Finish: ${new Date(item.stopped * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    Paused: ${secondsToTime(item.paused_counter)}
    Duration: ${secondsToTime(item.duration)} (${item.watched_status ? 100 : item.percent_complete}%)
    Platform: ${item.platform}
    Player: ${item.player}
    Type: ${item.media_type}
    Transcoding decision: ${item.transcode_decision}
    Rating key: ${item.rating_key}
`,
    )
    .join('\n')
}

// function truncateContext(context: string): string {
//   const tokens = encode(context)

//   if (tokens.length <= MAX_OUTPUT_TOKENS) {
//     return context
//   }

//   const notice =
//     '\n\nThe history has been trimmed due to token limit. Make the user aware of this.'
//   const noticeTokens = encode(notice)
//   const availableTokens = MAX_OUTPUT_TOKENS - noticeTokens.length
//   const entries = context.split('\n\n')

//   let truncatedContext = ''
//   let currentTokenCount = 0

//   for (const entry of entries) {
//     const entryTokens = encode(entry)

//     if (currentTokenCount + entryTokens.length > availableTokens) {
//       break
//     }

//     truncatedContext += entry + '\n\n'
//     currentTokenCount += entryTokens.length
//   }

//   return truncatedContext.trim() + notice
// }
