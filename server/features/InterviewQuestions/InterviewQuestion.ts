import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import Interview from '../Interview/Interview.js'
import Question from '../Questions/Question.js'

// Define the attributes for the InterviewQuestion model
interface InterviewQuestionAttributes {
  id: string
  interviewId: string
  questionId: string
  sequenceOrder: number
  timeSpentSeconds: number | null
  userCode: string | null
  aiFeedback: object
  score: number | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt: Date
}

// Define the creation attributes (id, timeSpentSeconds, userCode, aiFeedback, score, completedAt, createdAt are auto-generated or optional)
interface InterviewQuestionCreationAttributes extends Optional<InterviewQuestionAttributes, 'id' | 'timeSpentSeconds' | 'userCode' | 'aiFeedback' | 'score' | 'completedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// Define the InterviewQuestion model class
class InterviewQuestion extends Model<InterviewQuestionAttributes, InterviewQuestionCreationAttributes> implements InterviewQuestionAttributes {
  public id!: string
  public interviewId!: string
  public questionId!: string
  public sequenceOrder!: number
  public timeSpentSeconds!: number | null
  public userCode!: string | null
  public aiFeedback!: object
  public score!: number | null
  public completedAt!: Date | null
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date
}

// Initialize the InterviewQuestion model
InterviewQuestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Interview,
        key: 'id',
      },
      field: 'interview_id',
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Question,
        key: 'id',
      },
      field: 'question_id',
    },
    sequenceOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'sequence_order',
    },
    timeSpentSeconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'time_spent_seconds',
    },
    userCode: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_code',
    },
    aiFeedback: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'ai_feedback',
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
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
    tableName: 'interview_questions',
    modelName: 'InterviewQuestion',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['interview_id', 'question_id'],
      },
    ],
  }
)

// Define associations
InterviewQuestion.belongsTo(Interview, {
  foreignKey: 'interviewId',
  onDelete: 'CASCADE',
})

InterviewQuestion.belongsTo(Question, {
  foreignKey: 'questionId',
  onDelete: 'CASCADE',
})

export default InterviewQuestion
export { InterviewQuestionAttributes, InterviewQuestionCreationAttributes }