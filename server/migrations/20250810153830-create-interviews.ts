export default {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('interviews', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      difficulty_level: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      programming_language: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      feedback: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      ai_personality: {
        type: Sequelize.STRING(50),
        defaultValue: 'standard',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('interviews')
  }
}
