import WebSocket from 'ws'
import Interview from './Interview.js'
import { generateId } from '../../utils/strings.js'
import { reqType, resType } from '../../config/types.js'
import { asyncWrapper, asyncWsWrapper } from '../../utils/asyncWrapper.js'
import { connectToSTTSocket, generateAudio, sendViaWS } from './Interview.services.js'
import { AUDIO_CHUNK_SIZE } from '../../utils/constants.js'

const interviewSession = async (ws: WebSocket, req: reqType) => {
  const interviewSessionId = req.params.sessionId
  console.log('WebSocket connected for session:', interviewSessionId)

  const voskWebSocket = await connectToSTTSocket(ws)
  // Send welcome message
  sendViaWS(ws, 'chat', 'Hello! Connected to interview session.')

  // const audio = await generateAudio('Hello! Interview will begin shortly')
  // const audio = await generateAudio('Hello!')
  // const bufferedAudio = Buffer.from(await audio.arrayBuffer())

  // const totalChunks = Math.ceil(bufferedAudio.length / AUDIO_CHUNK_SIZE);
  
  // const startTime = performance.now()
  // sendViaWS(
  //   ws,
  //   'tts_start',
  //   {
  //     totalChunks,
  //     format: 'pcm',
  //     totalSize: bufferedAudio.length,
  //   }
  // )

  // let totalLatency = 0
  // for (let i = 0; i < totalChunks; i++) {
  //   const chunkStartTime = performance.now()
    
  //   const start = i * AUDIO_CHUNK_SIZE
  //   const end = Math.min(start + AUDIO_CHUNK_SIZE, bufferedAudio.length)
  //   const chunk = bufferedAudio.subarray(start, end)
    
  //   sendViaWS(
  //     ws,
  //     'tts_chunk',
  //     {
  //       chunkIndex: i,
  //       isLast: i === totalChunks - 1,
  //       chunk: chunk.toString('base64'),
  //     }
  //   )

  //   const chunkLatency = performance.now() - chunkStartTime
  //   totalLatency += chunkLatency

  //   // Small delay to prevent overwhelming the connection
  //   await new Promise(resolve => setTimeout(resolve, 5))
  // }

  // const totalTime = performance.now() - startTime
  
  // sendViaWS(
  //   ws,
  //   'tts_complete',
  //   { 
  //     totalChunks,
  //     metrics: {
  //       totalTimeMs: Math.round(totalTime),
  //       averageChunkLatencyMs: Math.round(totalLatency / totalChunks),
  //       totalLatencyMs: Math.round(totalLatency)
  //     }
  //   }
  // )

  // Set up ping/pong mechanism to keep connection alive
  let pingInterval: NodeJS.Timeout
  let pongTimeout: NodeJS.Timeout
  
  // Start ping interval
  pingInterval = setInterval(() => {
    ws.ping()
  }, 30000) // Ping every 30 seconds
  
  // Handle pong responses
  ws.on('pong', () => {
    console.log('Received pong from client for session:', interviewSessionId)
    // Clear any existing pong timeout
    if (pongTimeout) {
      clearTimeout(pongTimeout)
    }
  })
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const isMessageOfTypeBuffer = Buffer.isBuffer(data)
      if (isMessageOfTypeBuffer) {
        voskWebSocket.send(data)
      } else {
        const message = JSON.parse(data.toString())
        console.log('LAKSJDLAKSJDLAKSJD', message)
        
        // Handle ping messages
        switch (message.type) {
          case 'ping':
            // Respond with pong
            ws.send(JSON.stringify({ type: 'pong' }))
            break
            
          case 'chat':
            // Echo the message back for now
            ws.send(JSON.stringify({
              type: 'chat',
              message: `Echo: ${message.message}`
            }))
            break

          default:
            console.log('Unknown message type:', message.type)
            break
        }
        
        console.log('Unknown message type:', message.type)
      }
    } catch (err) {
      console.error('Error parsing message:', err)
    }
  })
  
  // Handle connection close
  ws.on('close', (code, reason) => {
    console.log('WebSocket closed for session:', interviewSessionId, 'Code:', code, 'Reason:', reason?.toString())
    // Clean up intervals
    if (pingInterval) {
      clearInterval(pingInterval)
    }
    if (pongTimeout) {
      clearTimeout(pongTimeout)
    }
  })
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error for session:', interviewSessionId, error)
    // Clean up intervals
    if (pingInterval) {
      clearInterval(pingInterval)
    }
    if (pongTimeout) {
      clearTimeout(pongTimeout)
    }
  })
  
  // Set up initial pong timeout
  pongTimeout = setTimeout(() => {
    console.log('No pong received, closing connection for session:', interviewSessionId)
    ws.terminate()
  }, 35000) // Close if no pong within 35 seconds
}

const createInterviewSession = async (req: reqType, res: resType) => {
  // Keeping it static for now. Will ingest from user later
  const USER_ID = '2'
  const interview = await Interview.create({
    userId: USER_ID,
    title: 'title',
    difficultyLevel: '1',
    programmingLanguage: 'javascript',
    status: 'active',
    feedback: {},
    aiPersonality: 'lk',
    startedAt: new Date(),
    durationSeconds: 2,
    endedAt: new Date(),
    createdAt: new Date(),
    // updatedAt: new Date(),
    session_id: generateId()
  })

  res.json({ interview })
}

export default {
  interviewSession: asyncWsWrapper(interviewSession),
  createInterviewSession: asyncWrapper(createInterviewSession)
}