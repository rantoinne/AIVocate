import { Redis } from 'ioredis'
import { QueueOptions, WorkerOptions, ConnectionOptions } from 'bullmq'
import redis from './redis.js'

let clientInstance: Redis | null = redis

export const closeConnections = async () => {
  if (clientInstance) {
    await clientInstance.quit()
    clientInstance = null
  }
}

export const bullMQOpts: Pick<QueueOptions, 'connection'> = {
  connection: clientInstance as unknown as ConnectionOptions,
}

export const bullMQWorkerOpts: WorkerOptions = {
  ...bullMQOpts,
  concurrency: 1,
  removeOnFail: { count: 10 },
  removeOnComplete: { count: 10 },
}
