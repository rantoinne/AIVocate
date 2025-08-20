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

export const connectToSTTSocket = async (localServerWs: WebSocket): Promise<WebSocket> => {
  const webSocket = new WebSocket('ws://vosk-stt:8765')

  webSocket.on('open', () => {
    console.log('Connected to Vosk-stt')
  })

  webSocket.on('message', (data: WebSocket.RawData) => {
    const message = JSON.parse(data.toString())
    if (message.type === 'partial') {
      console.log('Received message:', message)
      /**
       * TODOs
       * 1.Save to DB
       * 2.Get completion
       * 3.Generate Audio
       * 4.sendToWS(localServerWs, 'ai_message', audio chunks similar to greeting message)
       *  */
    }
  })

  return webSocket
}
