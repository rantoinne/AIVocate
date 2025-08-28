import WebSocket from 'ws'
import { INTERVIEWER_PROMPT, openai } from "../../llm.js"
import AIConversation from '../AIConversations/AIConversation.js'
import Interview from './Interview.js'
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses.mjs'
import { AUDIO_CHUNK_SIZE } from '../../utils/constants.js'
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from 'openai/resources'
import { syncTranscriptQueue } from './Interview.cron.js'

export const sendViaWS = (ws: WebSocket, type: string, message: string | object) => {
  if (typeof message === 'object') {
    message = JSON.stringify(message)
  }
  ws.send(JSON.stringify({ type, message }))
}

export const generateAudio = async (input: string) => {
  const audio = await openai.audio.speech.create({
    input,
    model: 'tts-1',
    voice: 'nova',
    response_format: 'pcm',
  })

  return audio
}

export const connectToSTTSocket = async (
  localServerWs: WebSocket,
  sessionId: string,
  context: { transcripts: ChatCompletionMessageParam[] }
): Promise<WebSocket> => {
  const webSocket = new WebSocket(`ws://${process.env.VOSK_STT_HOST}:${process.env.VOSK_STT_PORT}`)

  const interviewSession = await Interview.findOne({ where: { sessionId: sessionId } })

  const interviewId = interviewSession.get('id')
  
  webSocket.on('open', () => {
    console.log('Connected to Vosk-stt')
  })

  webSocket.on('message', async (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString())
    if (message.type === 'final') {
      await syncTranscriptQueue.add('push-transcript', { message: message.transcript, speaker: 'user', interviewId })

      sendViaWS(localServerWs, 'user_transcript', message.transcript)
      context.transcripts.push({
        role: 'user',
        content: message.transcript,
      })

      console.log('context.transcripts', context.transcripts)

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'developer',
          content: INTERVIEWER_PROMPT,
        }, ...context.transcripts],
      })

      console.log('ResponseCreateParamsNonStreaming', JSON.stringify(completion))

      context.transcripts.push({
        role: 'assistant',
        content: completion.choices[0].message.content,
      })

      await syncTranscriptQueue.add('push-transcript', { message: completion.choices[0].message.content, speaker: 'ai_interviewer', interviewId })


      // const audio = await generateAudio(completion.output_text)

      // await dispatchAudioChunksViaWS(localServerWs, audio, completion.output_text)
    }
  })

  return webSocket
}

export const dispatchAudioChunksViaWS = async (ws: WebSocket, audio: any, text: string) => {
  const bufferedAudio = Buffer.from(await audio.arrayBuffer())

  const totalChunks = Math.ceil(bufferedAudio.length / AUDIO_CHUNK_SIZE);
  
  const startTime = performance.now()
  sendViaWS(
    ws,
    'tts_start',
    {
      text,
      totalChunks,
      format: 'pcm',
      totalSize: bufferedAudio.length,
    }
  )

  let totalLatency = 0
  for (let i = 0; i < totalChunks; i++) {
    const chunkStartTime = performance.now()
    
    const start = i * AUDIO_CHUNK_SIZE
    const end = Math.min(start + AUDIO_CHUNK_SIZE, bufferedAudio.length)
    const chunk = bufferedAudio.subarray(start, end)
    
    sendViaWS(
      ws,
      'tts_chunk',
      {
        chunkIndex: i,
        isLast: i === totalChunks - 1,
        chunk: chunk.toString('base64'),
      }
    )

    const chunkLatency = performance.now() - chunkStartTime
    totalLatency += chunkLatency

    // Small delay to prevent overwhelming the connection
    await new Promise(resolve => setTimeout(resolve, 5))
  }

  const totalTime = performance.now() - startTime
  
  sendViaWS(
    ws,
    'tts_complete',
    { 
      totalChunks,
      metrics: {
        totalTimeMs: Math.round(totalTime),
        averageChunkLatencyMs: Math.round(totalLatency / totalChunks),
        totalLatencyMs: Math.round(totalLatency)
      }
    }
  )
}
