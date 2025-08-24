import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import Interview from '../Interview/Interview.js'

// Define the attributes for the AIConversation model
interface AIConversationAttributes {
  id: string
  interviewId: number
  speaker: 'user' | 'ai_interviewer'
  message: string
  messageType: string
  metadata: object
  timestamp: Date
  createdAt: Date
  updatedAt: Date
  deletedAt: Date
}

// Define the creation attributes (id, metadata, timestamp are auto-generated or optional)
interface AIConversationCreationAttributes extends Optional<AIConversationAttributes, 'id' | 'metadata' | 'timestamp'> {}

// Define the AIConversation model class
class AIConversation extends Model<AIConversationAttributes, AIConversationCreationAttributes> implements AIConversationAttributes {
  public id!: string
  public interviewId!: number
  public speaker!: AIConversationAttributes['speaker']
  public message!: string
  public messageType!: string
  public metadata!: object
  public timestamp!: Date
  public createdAt!: Date
  public updatedAt!: Date
  public deletedAt!: Date
}

// Initialize the AIConversation model
AIConversation.init(
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
    speaker: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.STRING(50),
      defaultValue: 'text',
      field: 'message_type',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'ai_conversations',
    modelName: 'AIConversation',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
)

// Define associations
AIConversation.belongsTo(Interview, {
  foreignKey: 'interviewId',
  onDelete: 'CASCADE',
})

export default AIConversation
export { AIConversationAttributes, AIConversationCreationAttributes }