import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'
import Interview from '../Interview/Interview.js'

// Define the attributes for the AIConversation model
interface AIConversationAttributes {
  id: string
  interviewId: string
  speaker: string
  message: string
  messageType: string
  metadata: object
  timestamp: Date
}

// Define the creation attributes (id, metadata, timestamp are auto-generated or optional)
interface AIConversationCreationAttributes extends Optional<AIConversationAttributes, 'id' | 'metadata' | 'timestamp'> {}

// Define the AIConversation model class
class AIConversation extends Model<AIConversationAttributes, AIConversationCreationAttributes> implements AIConversationAttributes {
  public id!: string
  public interviewId!: string
  public speaker!: string
  public message!: string
  public messageType!: string
  public metadata!: object
  public timestamp!: Date
}

// Initialize the AIConversation model
AIConversation.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    interviewId: {
      type: DataTypes.UUID,
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
  },
  {
    sequelize,
    tableName: 'ai_conversations',
    modelName: 'AIConversation',
    timestamps: true,
    underscored: true,
  }
)

// Define associations
AIConversation.belongsTo(Interview, {
  foreignKey: 'interviewId',
  onDelete: 'CASCADE',
})

export default AIConversation
export { AIConversationAttributes, AIConversationCreationAttributes }