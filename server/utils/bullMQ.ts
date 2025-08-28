import { Redis } from 'ioredis'
import { QueueOptions, WorkerOptions, ConnectionOptions } from 'bullmq'
import redis from './redis.js'

const redisDB = parseInt(process.env.REDIS_DB || '0', 10)
const redisURL = `redis://${process.env.REDIS_DB_HOST}:${process.env.REDIS_DB_PORT}`

let clientInstance: Redis | null = new Redis(
  redisURL,
  { db: redisDB, maxRetriesPerRequest: null }
)

export const closeConnections = async () => {
  if (clientInstance) {
    await clientInstance.quit()
    clientInstance = null
  }
}

export const bullMQOpts: QueueOptions = {
  connection: clientInstance as unknown as ConnectionOptions,
  prefix: 'aivocate://'
}

export const bullMQWorkerOpts: WorkerOptions = {
  ...bullMQOpts,
  concurrency: 1,
  removeOnFail: { count: 10 },
  removeOnComplete: { count: 10 },
  prefix: 'aivocate://',
}
