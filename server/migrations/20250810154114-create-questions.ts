import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.createTable('questions', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      difficulty: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      programming_languages: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      test_cases: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      solution_template: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      time_limit_minutes: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.dropTable('questions')
  }
}
