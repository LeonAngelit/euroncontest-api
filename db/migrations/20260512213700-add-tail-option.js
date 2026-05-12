const { USER_COUNTRY_TABLE } = require('../models/user-country.model');
const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    await queryInterface.addColumn(USER_COUNTRY_TABLE, 'tail_option', {
      allowNull: false,
      defaultValue: false,
      type: DataTypes.BOOLEAN,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(USER_COUNTRY_TABLE, 'tail_option');
  },
};
