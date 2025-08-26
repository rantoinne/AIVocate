import { Redis } from 'ioredis'

const redisDB = parseInt(process.env.REDIS_DB || '0', 10)
const redisURL = `redis://${process.env.REDIS_DB_HOST}:${process.env.REDIS_DB_PORT}`

const redis = new Redis(redisURL, { db: redisDB })

export default redis
