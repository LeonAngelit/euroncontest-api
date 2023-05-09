const { Model, DataTypes } = require('sequelize');

const COUNTRY_TABLE = 'countries';

const CountrySchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING,
    unique: true,
  },
  code: {
    allowNull: false,
    type: DataTypes.STRING,
    unique: true,
  },
  song: {
    allowNull: true,
    type: DataTypes.STRING,
    unique: true,
  },
  position: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  points: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  link: {
    type: DataTypes.STRING,
  },
};

class Country extends Model {
  static associate(models) {}

  static config(sequelize) {
    return {
      sequelize,
      tableName: COUNTRY_TABLE,
      modelName: 'Country',
      timestamps: false,
    };
  }
}

module.exports = { COUNTRY_TABLE, CountrySchema, Country };
