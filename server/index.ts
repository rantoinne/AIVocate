import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import * as http from 'http'
import bodyParser from 'body-parser'
import cors from 'cors'
import expressWs from 'express-ws'
import routes from './routes.js'
import syncDatabase from './config/syncDatabase.js'

const { app } = expressWs(express())

app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(
  cors({
    origin: (_origin, callback) => {
      callback(null, true)
    },
    optionsSuccessStatus: 200,
  }),
)

app.get('/ding', (_, res) => res.send('dong!'))

routes(app)

const port = Number(process.env.NODE_PORT) || 8000
let server: http.Server

// Initialize database and start server
syncDatabase().then(() => {
  server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server up and running on port ${port}`)
  })

  process.on('SIGINT', async () => {
    // handle graceful shutdown
    console.log('Gracefully shutting down...')
    server.close(() => {
      console.log('Server closed.')
      process.exit(0)
    })
  })
})

export default server
