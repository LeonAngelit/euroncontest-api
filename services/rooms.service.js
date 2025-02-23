const boom = require('@hapi/boom');
const { models } = require('../lib/sequelize');
const ArchiveService = require('../services/archive.service');
const archiveService = new ArchiveService();

class RoomService {
  constructor() {}

  async create(data) {
    const newRoom = await models.Room.create(data);
    await this.addUser({
      roomId: newRoom.id,
      userId: newRoom.adminId,
    });
    return newRoom;
  }

  async addUser(data) {
    const newRoomUser = await models.RoomUser.create(data);
    const room = await this.findOne(newRoomUser.roomId);
    const user = await models.User.findByPk(newRoomUser.userId);
    const response = {
      room,
      user,
    };
    return response;
  }

  async removeUser(data) {
    const rta = await models.RoomUser.destroy({
      where: {
        userId: data.userId,
        roomId: data.roomId,
      },
    });

    return rta;
  }

  async find() {
    const rooms = await models.Room.findAll({
      include: [
        {
          model: models.User,
          as: 'users',
          through: {
            attributes: [], // exclude the join table columns
          },
          include: [
            {
              model: models.Country,
              as: 'countries',
              through: {
                attributes: [], // exclude the join table columns
              },
              attributes: { exclude: ['link'] },
            },
          ],
          attributes: { exclude: ['password', 'token'] },
        },
      ],
      attributes: { exclude: ['password'] },
    });
    return rooms;
  }

  async findOne(id) {
    const room = await models.Room.findByPk(id, {
      include: [
        {
          model: models.User,
          as: 'users',
          through: {
            attributes: [], // exclude the join table columns
          },
          include: [
            {
              model: models.Country,
              as: 'countries',
              attributes: { exclude: ['link'] },
            },
          ],
          attributes: { exclude: ['password', 'token'] },
        },
      ],
      attributes: { exclude: ['password'] },
    });
    if (!room) {
      throw boom.notFound('Room not found');
    }
    return room;
  }

  async findOneByName(name) {
    const room = await models.Room.findOne({
      where: { name: name },
      include: [
        {
          model: models.User,
          as: 'users',
          through: {
            attributes: [], // exclude the join table columns
          },
          include: [
            {
              model: models.Country,
              as: 'countries',
              through: {
                attributes: [], // exclude the join table columns
              },
              attributes: { exclude: ['link'] },
            },
          ],
          attributes: { exclude: ['password', 'token'] },
        },
      ],
    });
    if (!room) {
      throw boom.notFound('Room not found');
    }
    return room;
  }

  async update(id, data) {
    const room = await this.findOne(id);
    const rta = await room.update(data);
    return rta;
  }

  async delete(id) {
    const room = await models.Room.findByPk(id);
    if (!room) {
      throw boom.notFound('Room not found');
    }
    room.destroy();
    return { id };
  }

  async exportResultsToMongo() {
    const rooms = await this.find();
    
  // avoid circular structure
  const roomsObject = JSON.parse(JSON.stringify(rooms));
  const data = {
    year: new Date().getFullYear(),
    rooms: roomsObject,
  };
    const created = await archiveService.create(data);
    return created;
  }
}

module.exports = RoomService;
