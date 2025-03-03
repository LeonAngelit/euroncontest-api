const { Model, DataTypes } = require('sequelize');

const UPDATABLE_TABLE = 'updatable';

const UpdatableSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  updatable: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    unique: true,
    default: true,
  },
  updatable_user: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    unique: true,
    default: true,
  },
  master_password: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  refresh_enabled: {
    allowNull: false,
    type: DataTypes.BOOLEAN,
    default: true,
  },
  last_updated_year: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },


};

class Updatable extends Model {
  static associate(models) {}

  static config(sequelize) {
    return {
      sequelize,
      tableName: UPDATABLE_TABLE,
      modelName: 'Updatable',
      timestamps: false,
    };
  }
}

module.exports = { UPDATABLE_TABLE, UpdatableSchema, Updatable };
