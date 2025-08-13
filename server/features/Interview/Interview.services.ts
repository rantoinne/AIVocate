import WebSocket from 'ws'
import { openai } from "../../llm.js"

export const sendViaWS = (ws: WebSocket, type: string, message: string | object) => {
  if (typeof message === 'object') {
    message = JSON.stringify(message)
  }
  ws.send(JSON.stringify({ type, message }))
}

export const generateAudio = async (text: string) => {
  const audio = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
    response_format: 'mp3',
  })

  return audio
}
