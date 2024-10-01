import { TautulliItemRow } from '@/types/tautulli'
import fetchTautulli from '@/utils/fetchTautulli'
import getSettings from '@/utils/getSettings'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, userId } = await req.json()
  const historyData = await fetchTautulli<{ data: TautulliItemRow[] }>(
    'get_history',
    {
      length: 10,
    },
    true,
  )
  const history = historyData?.response?.data.data
  const formattedHistory =
    history
      ?.map(
        (item: TautulliItemRow) => `
    - ${item.title} (${item.year})
      User: ${item.friendly_name}
      Date: ${new Date(item.date * 1000).toISOString().split('T')[0]}
      Duration: ${Math.round(item.duration / 60)} minutes
      Platform: ${item.platform}
      Product: ${item.product}
      Media Type: ${item.media_type}
      Full Title: ${item.full_title}
      Watched: ${item.watched_status}
      Percent completed: ${item.percent_complete}
      Transcoding decision: ${item.transcode_decision}
      Rating key: ${item.rating_key}
      User ID: ${item.user_id}
  `,
      )
      .join('\n') || 'No recent viewing history available.'

  console.log(formattedHistory)

  const settings = getSettings()
  const openai = createOpenAI({
    apiKey: settings.connection.openaiApiKey,
  })
  const result = await streamText({
    model: openai('gpt-4o-mini'),
    system:
      `You are an AI assistant for a Plex server, using Tautulli to provide information about viewing history and media content. ` +
      `Your primary function is to answer questions about the Plex library, viewing habits, and provide recommendations based on the viewing history. ` +
      `Do not provide answers to questions that are not related to the Plex server or its media content. ` +
      `Recent Plex viewing history from the Tautulli API: ` +
      `${formattedHistory} ` +
      `Use this information to provide context for your responses. ` +
      `The user asking the questions is ${userId}` +
      `If asked about content not in the history, you can still provide general information or recommendations based on the types of content the users watch.`,
    messages: messages,
  })

  return result.toDataStreamResponse()
}
