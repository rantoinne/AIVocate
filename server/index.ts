import 'dotenv/config'
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
// import session from 'express-session'
import expressWs from 'express-ws'

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

const port = Number(process.env.NODE_PORT) || 8000
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server up and running on port ${port}`)
})

process.on('SIGINT', async () => {
  // handle graceful shutdown
})

export default server
