import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../../config/database.js'

// Define the attributes for the User model
interface UserAttributes {
  id: string
  email: string
  username: string
  passwordHash: string
  profile: object
  skillLevel: string
  createdAt: Date
  updatedAt: Date
}

// Define the creation attributes (id, createdAt, updatedAt are auto-generated)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'profile' | 'skillLevel' | 'createdAt' | 'updatedAt'> {}

// Define the User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string
  public email!: string
  public username!: string
  public passwordHash!: string
  public profile!: object
  public skillLevel!: string
  public createdAt!: Date
  public updatedAt!: Date
}

// Initialize the User model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    profile: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    skillLevel: {
      type: DataTypes.STRING(20),
      defaultValue: 'beginner',
      field: 'skill_level',
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
    tableName: 'users',
    modelName: 'User',
    timestamps: true,
    underscored: true,
  }
)

export default User
export { UserAttributes, UserCreationAttributes }