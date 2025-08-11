import WebSocket from 'ws'
import Interview from './Interview.js'
import { generateId } from '../../utils/strings.js'
import { reqType, resType } from '../../config/types.js'
import { asyncWrapper, asyncWsWrapper } from '../../utils/asyncWrapper.js'

const interviewSession = async (ws: WebSocket, req: reqType) => {
  const interviewSessionId = req.params.sessionId
  console.log('WebSocket connected for session:', interviewSessionId)
  
  // Send welcome message
  ws.send(JSON.stringify({ type: 'chat', message: 'Hello! Connected to interview session.' }))
  
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
      const message = JSON.parse(data.toString())
      console.log('Received message:', message)
      
      // Handle ping messages
      if (message.type === 'ping') {
        // Respond with pong
        ws.send(JSON.stringify({ type: 'pong' }))
        return
      }
      
      // Handle chat messages
      if (message.type === 'chat') {
        // Echo the message back for now
        ws.send(JSON.stringify({
          type: 'chat',
          message: `Echo: ${message.message}`
        }))
        return
      }
      
      console.log('Unknown message type:', message.type)
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