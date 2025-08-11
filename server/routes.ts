import * as express from 'express'
import expressWs from 'express-ws'
import { nextType, reqType, resType } from './config/types.js'
import { ApplicationError } from './utils/errors.js'
import pistonRouter from './features/Piston/Piston.routes.js'
import interviewRouter, { interviewWebSocketEnabledRouter } from './features/Interview/Interview.routes.js'

export default function routes(app: expressWs.Application) {
  app.use(pistonRouter)
  app.use(interviewRouter)
  
  interviewWebSocketEnabledRouter(app)
  
  app.use('/api', (_req: reqType, res: resType) => res.status(404).end('404: Not found'))

  // NOTE: We're using a named function so it shows the name on express debugging and stack traces
  // NOTE: Don't remove "_next" on errorHandler function although it isn't used, if we remove it
  // nodejs won't know this function is for error handling
  // (More info: https://expressjs.com/en/guide/error-handling.html)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: ApplicationError, req: reqType, res: resType, _next: nextType) => {
    // Only handle errors for API routes
    if (req.path.startsWith('/api')) {
      console.log('Error: ', err)
      let errorResponse = {
        message: err?.status ? (err.message ?? 'Error interno') : 'Error interno',
        type: err?.type,
      }
      // @ts-ignore
      if (err.validationError) errorResponse = { ...err.validationError, ...errorResponse }

      res.status(err.status || 500).json(errorResponse)
    } else {
      // Pass non-API errors to the next error handler
      _next(err)
    }
  })
}
