import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.createTable('code_submissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      interview_question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interview_questions',
          key: 'id',
        },
      },
      code: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      language: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      execution_result: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      test_results: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      execution_time_ms: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      memory_usage_kb: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.dropTable('code_submissions')
  }
}
