import { sequelize } from './database.js'
import { User, Interview, Question, InterviewQuestion, CodeSubmission, AIConversation, UserProgress } from '../features/index.js'

const syncDatabase = async () => {
  try {
    // Authenticate and sync all models
    await sequelize.authenticate()
    console.log('Database connection established successfully.')

    // Sync all models
    await sequelize.sync({ alter: true })
    console.log('All models were synchronized successfully.')
  } catch (error) {
    console.error('Error syncing database:', error)
  }
}

export default syncDatabase