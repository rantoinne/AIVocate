import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import User from '../Users/User.js'

// Define the attributes for the Interview model
interface InterviewAttributes {
  id: number
  userId: string
  title: string
  difficultyLevel: string
  programmingLanguage: string
  status: string
  score: number | null
  feedback: object
  aiPersonality: string
  startedAt: Date | null
  endedAt: Date | null
  durationSeconds: number | null
  createdAt: Date
  sessionId: string
  updatedAt: Date
  deletedAt: Date
}

// Define the creation attributes (id, createdAt, startedAt, endedAt, durationSeconds are auto-generated or optional)
interface InterviewCreationAttributes extends Optional<InterviewAttributes, 'id' | 'score' | 'feedback' | 'startedAt' | 'endedAt' | 'durationSeconds' | 'createdAt'> {}

// Define the Interview model class
class Interview extends Model<InterviewAttributes, InterviewCreationAttributes> implements InterviewAttributes {
  public id!: number
  public userId!: string
  public title!: string
  public difficultyLevel!: string
  public programmingLanguage!: string
  public status!: string
  public score!: number | null
  public feedback!: object
  public aiPersonality!: string
  public startedAt!: Date | null
  public endedAt!: Date | null
  public durationSeconds!: number | null
  public createdAt!: Date
  public sessionId!: string
  public updatedAt!: Date
  public deletedAt!: Date
}

// Initialize the Interview model
Interview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      field: 'user_id',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    difficultyLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'difficulty_level',
    },
    programmingLanguage: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'programming_language',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    feedback: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    sessionId: {
      type: DataTypes.STRING(12),
      defaultValue: {},
    },
    aiPersonality: {
      type: DataTypes.STRING(50),
      defaultValue: 'standard',
      field: 'ai_personality',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at',
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at',
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration_seconds',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    }
  },
  {
    sequelize,
    tableName: 'interviews',
    modelName: 'Interview',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

// Define associations
Interview.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
})

export default Interview
export { InterviewAttributes, InterviewCreationAttributes }