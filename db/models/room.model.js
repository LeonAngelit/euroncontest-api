const { Model, DataTypes } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const ROOM_TABLE = 'rooms';

const RoomSchema = {
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
  password: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  adminId: {
    allowNull: false,
    field: 'admin_id',
    type: DataTypes.INTEGER,
    references: {
      model: USER_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
};

class Room extends Model {
  static associate(models) {
    this.belongsToMany(models.User, {
      as: 'users',
      through: models.RoomUser,
      foreignKey: 'roomId',
      otherKey: 'userId',
    });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: ROOM_TABLE,
      modelName: 'Room',
      timestamps: false,
    };
  }
}

module.exports = { ROOM_TABLE, RoomSchema, Room };
