const express = require('express');
const RoomService = require('../services/rooms.service');
const router = express.Router();
const service = new RoomService();
const validatorHandler = require('../midlewares/validator.handler');
const { jwtAuth, jwtAuthHighLevel, jwtAuthAdminLevel } = require('../midlewares/auth.handler');
const {
  createRoomSchema,
  getRoomSchema,
  updateRoomSchema,
  getRoomByNameSchema,
  addUserSchema,
} = require('./../schemas/room.schema');

router.get('/', jwtAuthAdminLevel('headers'), async (req, res) => {
  const rooms = await service.find();
  res.json(rooms);
});

router.get(
  '/:roomId/:id',
  jwtAuthHighLevel('headers', 'params'),
  validatorHandler(getRoomSchema, 'params'),
  async (req, res, next) => {
    try {
      const { roomId, id } = req.params;
      const room = await service.findOne(roomId);
      filteredRoom = room.users.filter(user => user.id == id);
      if (filteredRoom.length > 0) {
        res.json(room);
      } else {
        res.status(401).json({ error: "User not authorized to get this room" })
      }

    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/name/:name',
  jwtAuth('headers'),
  validatorHandler(getRoomByNameSchema, 'params'),
  async (req, res, next) => {
    try {
      const { name } = req.params;
      const room = await service.findOneByName(name);
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);
router.get('/archive/export/:year', jwtAuthAdminLevel('headers'), async (req, res) => {
  const { year } = req.params;
  const rooms = await service.exportResultsToMongo(year);
  res.json(rooms);
}
);

router.get('/generateRoomToken/:roomId/:id', jwtAuthHighLevel('headers', 'params'), async (req, res) => {
  const { roomId, id } = req.params;
  filteredRoom = room.users.filter(user => user.id == id);
  if (filteredRoom.length > 0) {
    const token = await service.generateRoomToken(roomId);
    res.json(token);
  } else {
    res.status(401).json({ error: "User not authorized to get this room" })
  }
}
);

router.post('/verifyRoomToken/:id', jwtAuthHighLevel('headers', 'params'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const token = req.body?.token;
      const roomId = await service.verifyRoomToken(token, userId);
      res.status(201).json(roomId);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  jwtAuth('headers'),
  validatorHandler(createRoomSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newRoom = await service.create(body);
      res.status(201).json(newRoom);
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:id/stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  async function find() {
    const room = await service.findOne(id);
    res.write(`data: ${JSON.stringify(room)}\n\n`);
  }

  const { id } = req.params;
  const interval = setInterval(() => {
    find();
  }, 60000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

router.post(
  '/login',
  jwtAuthHighLevel('headers', 'body'),
  validatorHandler(addUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const rta = await service.loginByRoomName(body);
      res.status(201).json(rta);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/remove-user',
  jwtAuthHighLevel('headers', 'body'),
  validatorHandler(addUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const rta = await service.removeUser(body);
      res.status(204).json(rta);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:roomId/:id',
  jwtAuthHighLevel('headers', 'params'),
  validatorHandler(getRoomSchema, 'params'),
  validatorHandler(updateRoomSchema, 'body'),
  async (req, res, next) => {
    try {
      const { roomId, id } = req.params;
      const body = req.body;
      const room = await service.findOne(roomId);
      if (room.adminId == id) {
        const room = await service.update(roomId, body);
        res.json(room);
      } else {
        res.status(403).json({
          error: "Usuario no autorizado para realizar esta acción"
        })
      }
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getRoomByNameSchema, 'params'),
  validatorHandler(updateRoomSchema, 'body'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const room = await service.update(id, body);
      res.json(room);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:roomId/:id',
  jwtAuthHighLevel('headers', 'params'),
  validatorHandler(getRoomSchema, 'params'),
  async (req, res, next) => {
    try {
      const { roomId, id } = req.params;
      const room = await service.findOne(roomId);
      if (room.adminId == id) {
        const deleted = await service.delete(roomId);
        res.json(deleted);
      } else {
        res.status(403).json({
          error: "Usuario no autorizado para realizar esta acción"
        })
      }

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
