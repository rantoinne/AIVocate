import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.createTable('user_progress', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      skill_category: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      current_level: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
      },
      experience_points: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      strengths: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      improvement_areas: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      last_assessment_date: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Add unique constraint for user_id and skill_category combination
    await queryInterface.addConstraint('user_progress', {
      fields: ['user_id', 'skill_category'],
      type: 'unique',
      name: 'user_progress_user_id_skill_category_unique'
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.dropTable('user_progress')
  }
}
