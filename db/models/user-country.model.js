const { Model, DataTypes } = require('sequelize');
const { COUNTRY_TABLE } = require('./country.model');
const { USER_TABLE } = require('./user.model');

const USER_COUNTRY_TABLE = 'users_countries';

const UserCountrySchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: USER_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  countryId: {
    type: DataTypes.INTEGER,
    field: 'country_id',
    references: {
      model: COUNTRY_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  winnerOption: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
    field: 'winner_option',
  },
};

class UserCountry extends Model {
  static associate(models) {
    this.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId',
    });
  }
  static config(sequelize) {
    return {
      sequelize,
      tableName: USER_COUNTRY_TABLE,
      modelName: 'UserCountry',
      timestamps: false,
    };
  }
}

module.exports = { USER_COUNTRY_TABLE, UserCountrySchema, UserCountry };
