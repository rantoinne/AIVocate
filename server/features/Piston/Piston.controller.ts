import { Request, Response } from 'express'
import { asyncWrapper } from '../../utils/asyncWrapper.js'
import { ApplicationError } from '../../utils/errors.js'
import { getPistonEndpoint } from '../../utils/constants.js'

const executeCode = async (req: Request, res: Response) => {
  try {
    const {
      language = 'javascript',
      version = '20.11.1',
      files = [{ name: 'test.js', content: 'console.log("Hello from Piston!");' }],
    } = req.body

    const response = await fetch(`${getPistonEndpoint()}/api/v2/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        files,
        version,
        language,
      })
    })

    if (!response.ok) {
      throw new ApplicationError('Execution failed!', 500)
    }

    const data = await response.json()
    res.json({ data })
  } catch (error) {
    console.error('Error:', error.message)
    throw new ApplicationError('Execution failed Catch!', 500)
  }
}

export default {
  executeCode: asyncWrapper(executeCode),
}
