import { WebSocket } from 'ws'
import { reqType, resType, nextType } from '../config/types.js'
import { ApplicationError } from './errors.js'

export default function asyncUtil(
  fn: (reqType: reqType | WebSocket, resType: resType | reqType, next: nextType) => any,
) {
  return function asyncUtilWrap(req: reqType, res: resType, next: nextType) {
    return Promise.resolve(fn(req, res, next)).catch(next)
  }
}
