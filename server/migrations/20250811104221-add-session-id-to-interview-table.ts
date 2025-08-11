import * as Sequelize from 'sequelize'

export default {
  async up (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.addColumn('interviews', 'session_id', {
      unique: true,
      allowNull: false,
      type: Sequelize.STRING(12),
    })
  },

  async down (queryInterface: Sequelize.QueryInterface) {
    await queryInterface.removeColumn('interviews', 'session_id')
  }
}
