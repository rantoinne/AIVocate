import * as express from 'express'

export type reqType = express.Request
export type resType = express.Response
export type nextType = express.NextFunction

declare global {
  namespace Express {
    interface Request {
      user?: {
        type: string
        userId: number
      }
      originalBody: any
      files?: any
    }
  }
}
