import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import User from '../Users/User.js'

// Define the attributes for the UserProgress model
interface UserProgressAttributes {
  id: string
  userId: string
  skillCategory: string
  currentLevel: number
  experiencePoints: number
  strengths: string[]
  improvementAreas: string[]
  lastAssessmentDate: Date | null
  updatedAt: Date
}

// Define the creation attributes (id, currentLevel, experiencePoints, strengths, improvementAreas, lastAssessmentDate, updatedAt are auto-generated or optional)
interface UserProgressCreationAttributes extends Optional<UserProgressAttributes, 'id' | 'currentLevel' | 'experiencePoints' | 'strengths' | 'improvementAreas' | 'lastAssessmentDate' | 'updatedAt'> {}

// Define the UserProgress model class
class UserProgress extends Model<UserProgressAttributes, UserProgressCreationAttributes> implements UserProgressAttributes {
  public id!: string
  public userId!: string
  public skillCategory!: string
  public currentLevel!: number
  public experiencePoints!: number
  public strengths!: string[]
  public improvementAreas!: string[]
  public lastAssessmentDate!: Date | null
  public updatedAt!: Date
}

// Initialize the UserProgress model
UserProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    skillCategory: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'skill_category',
    },
    currentLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'current_level',
    },
    experiencePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'experience_points',
    },
    strengths: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    improvementAreas: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      field: 'improvement_areas',
    },
    lastAssessmentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_assessment_date',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'user_progress',
    modelName: 'UserProgress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'skill_category'],
      },
    ],
  }
)

// Define associations
UserProgress.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
})

export default UserProgress
export { UserProgressAttributes, UserProgressCreationAttributes }