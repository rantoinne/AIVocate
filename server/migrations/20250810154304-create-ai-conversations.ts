import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.createTable('ai_conversations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      interview_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interviews',
          key: 'id',
        },
      },
      speaker: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      message_type: {
        type: Sequelize.STRING(50),
        defaultValue: 'text',
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.dropTable('ai_conversations')
  }
}
