import WebSocket from 'ws'
import { openai } from "../../llm.js"
import AIConversation from '../AIConversations/AIConversation.js'
import Interview from './Interview.js'
import { ResponseCreateParamsNonStreaming } from 'openai/resources/responses/responses.mjs'
import { AUDIO_CHUNK_SIZE } from '../../utils/constants.js'

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

export const connectToSTTSocket = async (localServerWs: WebSocket, sessionId: string, context: { transcripts: { role: string, content: string }[] }): Promise<WebSocket> => {
  const webSocket = new WebSocket('ws://vosk-stt:8765')

  const interviewSession = await Interview.findOne({ where: { sessionId: sessionId } })
  webSocket.on('open', () => {
    console.log('Connected to Vosk-stt')
  })

  webSocket.on('message', async (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString())
    if (message.type === 'final') {
      console.log('Received message:', message)
      /**
       * TODOs
       * 1.Save to DB - Done
       * 2.Get completion - Done
       * 3.Generate Audio - Done
       * 4.sendToWS(localServerWs, 'ai_message', audio chunks similar to greeting message) - Done
       *  */
      sendViaWS(localServerWs, 'user_transcript', message.transcript)
      await AIConversation.create({
        messageType: 'TEXT',
        speaker: 'ai_interviewer',
        message: message.transcript,
        interviewId: interviewSession.get('id'),
      })
      context.transcripts.push({
        role: 'user',
        content: message.transcript,
      })

      const completion = await openai.responses.create({
        model: 'gpt-3.5-turbo',
        input: context.transcripts as ResponseCreateParamsNonStreaming['input'],
      })

      console.log('ResponseCreateParamsNonStreaming', completion.output_text)

      context.transcripts.push({
        role: 'assistant',
        content: completion.output_text,
      })

      const audio = await generateAudio(completion.output_text)

      await dispatchAudioChunksViaWS(localServerWs, audio, completion.output_text)
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
