import { Router } from 'express'
import expressWs from 'express-ws'
import interviewController from './Interview.controller.js'


export const interviewWebSocketEnabledRouter = (app: expressWs.Application) => {
  app.ws('/api/v1/interview-session/:sessionId', interviewController.interviewSession)
}

const interviewRouter = Router()

interviewRouter.post('/api/v1/interview-session', interviewController.createInterviewSession)

export default interviewRouter
