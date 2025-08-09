import { Router } from 'express'
import pistonController from './Piston.controller.js'

const pistonRouter = Router()

pistonRouter.get('/api/v1/execute', pistonController.executeCode)

export default pistonRouter
