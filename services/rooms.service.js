const boom = require('@hapi/boom');
const { models } = require('../lib/sequelize');
const ArchiveService = require('../services/archive.service');
const { authp, pkey } = require('../config/config');
const archiveService = new ArchiveService();
const jsonwebtoken = require('jsonwebtoken');
const UserService = require('./users.service');
const userService = new UserService();

class RoomService {
  constructor() { }

  async create(data) {
    let room = await models.Room.findOne({
      where: { name: data.name },
    });
    if (room) {
      throw boom.conflict("Invalid room name")
    }
    const newRoom = await models.Room.create(data);
    await this.addUser({
      roomId: newRoom.id,
      userId: data.adminId
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

  async loginByRoomName(name, password, userId) {
    let room = await models.Room.findOne({
      where: { name: name },
    });
    if (!room) {
      throw boom.notFound('Room not found');
    }
    if (bcrypt.compareSync(password.split('').reverse().join(''), room.password)) {
      const newRoomUser = await this.addUser({
        roomId: id,
        userId: userId
      });
      return newRoomUser;
    } else {
      throw boom.unauthorized('Incorrect room name or password');
    }
  }

  async loginByRoomId(id, password, userId) {
    let room = await models.Room.findByPk(id);
    if (!room) {
      throw boom.notFound('Room not found');
    }
    if (bcrypt.compareSync(password.split('').reverse().join(''), room.password)) {
      const newRoomUser = await this.addUser({
        roomId: id,
        userId: userId
      });
      return newRoomUser;
    } else {
      throw boom.unauthorized('Incorrect room name or password');
    }
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
            {
              model: models.UserCountry,
              as: 'winnerOption',
              where: { winnerOption: true },
              required: false,
              attributes: { exclude: ['id', 'userId', 'winnerOption'] },
            },
          ],
          attributes: { exclude: ['password', 'token', 'email_sent'] },
        },
      ],
      attributes: { exclude: ['password'] },
      order: [[{
        model
          : models.User, as: 'users'
      }, 'points', 'DESC']],
    });
    rooms.map(room => {
      room.users = room.users.filter(user => user.countries.length === 5);
    })

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
              through: {
                attributes: [], // exclude the join table columns
              },
              attributes: { exclude: ['link'] },
            },
            {
              model: models.UserCountry,
              as: 'winnerOption',
              where: { winnerOption: true },
              required: false,
              attributes: { exclude: ['id', 'userId', 'winnerOption'] },
            },
          ],
          attributes: { exclude: ['password', 'token', 'email', 'email_sent'] },
        },
      ],
      attributes: { exclude: ['password'] },
      order: [[{
        model
          : models.User, as: 'users'
      }, 'points', 'DESC']],
    });
    if (!room) {
      throw boom.notFound('Room not found');
    }
    room.dataValues.users = room.users.filter(user => user.dataValues.countries.length === 5);
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
            {
              model: models.UserCountry,
              as: 'winnerOption',
              where: { winnerOption: true },
              required: false,
              attributes: { exclude: ['id', 'userId', 'winnerOption'] },
            },
          ],
          attributes: { exclude: ['password', 'token', 'email', 'email_sent'] },
        },
      ],
      attributes: { exclude: ['password'] },
    });
    if (!room) {
      throw boom.notFound('Room not found');
    }
    return room;
  }

  async update(id, data) {
    let room = await models.Room.findOne({
      where: { name: data.name },
    });
    if (room) {
      throw boom.conflict("Invalid room name")
    }
    room = await this.findOne(id);
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

  async exportResultsToMongo(year) {
    let created = [];
    await archiveService.deleteByYear(year);
    const rooms = await this.find();
    for (const room of rooms) {
      try {
        let data = {
          year: parseInt(year),
          room: room
        };
        let parsedData = JSON.parse(JSON.stringify(data));
        const result = await archiveService.create(parsedData);
        created[rooms.indexOf(room)] = result;
      } catch (error) {
        throw boom.badImplementation('Error exporting results to Mongo');
      }
    }
    return {
      rooms_added: created.length,
      created
    }
  }

  async generateRoomToken(id) {
    const room = await this.findOne(id);
    if (room) {
      const token = jsonwebtoken.sign({ roomId: id, auth: authp }, pkey, { expiresIn: "24h" });
      return token;
    } else {
      throw boom.notFound('Room not found');
    }
  }

  async verifyRoomToken(token, userId) {
    try {
      const decoded = jsonwebtoken.verify(token, pkey);
      if (decoded.auth === authp) {
        const newRoomUser = await this.addUser({
          roomId: decoded.roomId,
          userId: userId
        });
        return newRoomUser;
      } else {
        throw boom.unauthorized('Invalid token');
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw boom.unauthorized('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw boom.unauthorized('Invalid token');
      }
      throw error; // rethrow other unexpected errors
    }

  }
}

module.exports = RoomService;
