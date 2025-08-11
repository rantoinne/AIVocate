import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.createTable('interview_questions', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER,
      },
      interview_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'interviews',
          key: 'id',
        },
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'questions',
          key: 'id',
        },
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      time_spent_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      ai_feedback: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
          max: 100,
        },
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    })

    // Add unique constraint for interview_id and question_id combination
    await queryInterface.addConstraint('interview_questions', {
      fields: ['interview_id', 'question_id'],
      type: 'unique',
      name: 'interview_questions_interview_id_question_id_unique'
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.dropTable('interview_questions')
  }
}
