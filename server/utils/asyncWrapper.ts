import WebSocket from 'ws'
import { reqType, resType, nextType } from '../config/types.js'

export const asyncWrapper = (
  fn: (reqType: reqType | WebSocket, resType: resType | reqType, next: nextType) => any,
) => {
  return function asyncUtilWrap(req: reqType, res: resType, next: nextType) {
    return Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export const asyncWsWrapper = (
  fn: (ws: WebSocket, req: reqType, ...args: any[]) => any
) => {
  return function wrappedWsHandler(ws: WebSocket, req: reqType, ...args: any[]) {
    Promise.resolve(fn(ws, req, ...args)).catch((err) => {
      console.error("WebSocket route error:", err)
      try {
        ws.send(JSON.stringify({ error: err.message || "Internal server error" }))
      } catch {
        // ignore send errors
      }
      ws.close()
    })
  }
}
