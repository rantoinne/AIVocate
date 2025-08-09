export class ApplicationError extends Error {
  type: string
  status: number
  mainError: any
  originalStack: string
  sourceLocation: string

  constructor(message: string, status = 500, type = undefined, error = undefined) {
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.status = status
    this.type = type
    this.mainError = error

    // Always capture the stack trace first
    Error.captureStackTrace(this, this.constructor)

    // Store the current stack as our source location
    this.sourceLocation = this.stack

    if (error) {
      console.log('Error: ', error)
      // Preserve the original error's stack trace
      this.originalStack = error.stack || error.toString()
      // Combine both stack traces for complete context
      this.stack = `Original Error: ${error.stack}\n\nThrown from:\n${this.stack}`
    } else {
      // If no original error, our current stack is the source
      this.originalStack = this.stack
    }
  }
}
