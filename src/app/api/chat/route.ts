import { TautulliItemRow } from '@/types/tautulli'
import fetchTautulli from '@/utils/fetchTautulli'
import { secondsToTime } from '@/utils/formatting'
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
    - ${item.full_title} (${item.year})
      Viewed by user: ${item.friendly_name} (${item.user_id})
      Date watched: ${new Date(item.date * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      Started at: ${new Date(item.date * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      Finished at: ${new Date(item.date * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
      Paused: ${item.paused_counter} times
      Duration: ${secondsToTime(item.duration)}
      Platform: ${item.platform}
      Player: ${item.player}
      Media Type: ${item.media_type}
      Finished: ${item.watched_status ? 'Yes' : 'No'}
      Percent completed: ${item.watched_status ? 100 : item.percent_complete}%
      Transcoding decision: ${item.transcode_decision}
      Rating key: ${item.rating_key}
  `,
      )
      .join('\n') || 'No recent viewing history available.'
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
      `If asked about content not in the history, you can still provide general information or recommendations based on the types of content the users watch. ` +
      `Try to keep the response concise and to the point without providing too much detail. ` +
      `Today is ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Feel free to use provide this date in your response if it's relevant.`,
    messages: messages,
  })

  return result.toDataStreamResponse()
}
