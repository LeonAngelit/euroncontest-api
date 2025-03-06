const { Model, DataTypes } = require('sequelize');

const USER_TABLE = 'users';

const UserSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  username: {
    allowNull: false,
    type: DataTypes.STRING,
    unique: true,
  },
  password: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  color: {
    allowNull: true,
    type: DataTypes.STRING,
    defaultValue: '#FFFFFF',
  },
  image: {
    allowNull: true,
    type: DataTypes.STRING,
  },
  points: {
    allowNull: true,
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  token: {
    allowNull: true,
    type: DataTypes.STRING,
  },
};

class User extends Model {
  static associate(models) {
    this.belongsToMany(models.Country, {
      as: 'countries',
      through: models.UserCountry,
      foreignKey: 'userId',
      otherKey: 'countryId',
    });
    this.belongsToMany(models.Room, {
      as: 'rooms',
      through: models.RoomUser,
      foreignKey: 'userId',
      otherKey: 'roomId',
    });
    this.hasMany(models.UserCountry, {
      as: 'winnerOption',
      foreignKey: 'userId',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: USER_TABLE,
      modelName: 'User',
      timestamps: false,
    };
  }
}

module.exports = { USER_TABLE, UserSchema, User };
