import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
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

async function runCode() {
  try {
    const response = await fetch(`${process.env.PISTON_ENDPOINT}/api/v2/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        language: 'javascript',
        version: '20.11.1',
        files: [{ name: 'test.js', content: 'console.log("Hello from Piston!");' }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data.run.stdout); // Outputs: Hello from Piston!
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runCode()

const port = Number(process.env.NODE_PORT) || 8000
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server up and running on port ${port}`)
})

process.on('SIGINT', async () => {
  // handle graceful shutdown
})

export default server
