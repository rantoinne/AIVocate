import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// Create a new Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'aivocate',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
)

export { sequelize }