import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import InterviewQuestion from '../InterviewQuestions/InterviewQuestion.js'

// Define the attributes for the CodeSubmission model
interface CodeSubmissionAttributes {
  id: string
  interviewQuestionId: string
  code: string
  language: string
  executionResult: object | null
  testResults: object | null
  executionTimeMs: number | null
  memoryUsageKb: number | null
  submittedAt: Date
}

// Define the creation attributes (id, executionResult, testResults, executionTimeMs, memoryUsageKb, submittedAt are auto-generated or optional)
interface CodeSubmissionCreationAttributes extends Optional<CodeSubmissionAttributes, 'id' | 'executionResult' | 'testResults' | 'executionTimeMs' | 'memoryUsageKb' | 'submittedAt'> {}

// Define the CodeSubmission model class
class CodeSubmission extends Model<CodeSubmissionAttributes, CodeSubmissionCreationAttributes> implements CodeSubmissionAttributes {
  public id!: string
  public interviewQuestionId!: string
  public code!: string
  public language!: string
  public executionResult!: object | null
  public testResults!: object | null
  public executionTimeMs!: number | null
  public memoryUsageKb!: number | null
  public submittedAt!: Date
}

// Initialize the CodeSubmission model
CodeSubmission.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    interviewQuestionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: InterviewQuestion,
        key: 'id',
      },
      field: 'interview_question_id',
    },
    code: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    executionResult: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'execution_result',
    },
    testResults: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'test_results',
    },
    executionTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'execution_time_ms',
    },
    memoryUsageKb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'memory_usage_kb',
    },
    submittedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'submitted_at',
    },
  },
  {
    sequelize,
    tableName: 'code_submissions',
    modelName: 'CodeSubmission',
    timestamps: true,
    underscored: true,
  }
)

// Define associations
CodeSubmission.belongsTo(InterviewQuestion, {
  foreignKey: 'interviewQuestionId',
  onDelete: 'CASCADE',
})

export default CodeSubmission
export { CodeSubmissionAttributes, CodeSubmissionCreationAttributes }