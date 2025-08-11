import WebSocket from 'ws'
import Interview from './Interview.js'
import { generateId } from '../../utils/strings.js'
import { reqType, resType } from '../../config/types.js'
import { asyncWrapper, asyncWsWrapper } from '../../utils/asyncWrapper.js'

const interviewSession = async (ws: WebSocket, req: reqType) => {
  const interviewSessionId = req.params.sessionId
  console.log({ interviewSessionId })
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