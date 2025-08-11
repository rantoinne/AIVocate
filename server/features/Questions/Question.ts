import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'

// Define the attributes for the Question model
interface QuestionAttributes {
  id: string
  title: string
  description: string
  difficulty: string
  category: string
  programmingLanguages: string[]
  testCases: object
  solutionTemplate: object
  timeLimitMinutes: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// Define the creation attributes (id, createdAt, updatedAt, programmingLanguages, solutionTemplate, tags are auto-generated or optional)
interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'programmingLanguages' | 'solutionTemplate' | 'timeLimitMinutes' | 'tags' | 'createdAt' | 'updatedAt'> {}

// Define the Question model class
class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
  public id!: string
  public title!: string
  public description!: string
  public difficulty!: string
  public category!: string
  public programmingLanguages!: string[]
  public testCases!: object
  public solutionTemplate!: object
  public timeLimitMinutes!: number
  public tags!: string[]
  public createdAt!: Date
  public updatedAt!: Date
}

// Initialize the Question model
Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    programmingLanguages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'programming_languages',
    },
    testCases: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'test_cases',
    },
    solutionTemplate: {
      type: DataTypes.JSONB,
      defaultValue: {},
      field: 'solution_template',
    },
    timeLimitMinutes: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      field: 'time_limit_minutes',
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
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
  },
  {
    sequelize,
    tableName: 'questions',
    modelName: 'Question',
    timestamps: true,
    underscored: true,
  }
)

export default Question
export { QuestionAttributes, QuestionCreationAttributes }