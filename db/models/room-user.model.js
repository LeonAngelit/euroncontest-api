const { Model, DataTypes } = require('sequelize');
const { ROOM_TABLE } = require('./room.model');
const { USER_TABLE } = require('./user.model');

const ROOM_USER_TABLE = 'rooms_users';

const RoomUserSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  roomId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'room_id',
    references: {
      model: ROOM_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: USER_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
};

class RoomUser extends Model {
  static associate() {}
  static config(sequelize) {
    return {
      sequelize,
      tableName: ROOM_USER_TABLE,
      modelName: 'RoomUser',
      timestamps: false,
    };
  }
}

module.exports = { ROOM_USER_TABLE, RoomUserSchema, RoomUser };
