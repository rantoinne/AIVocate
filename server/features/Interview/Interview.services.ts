import WebSocket from 'ws'
import { openai } from "../../llm.js"

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
