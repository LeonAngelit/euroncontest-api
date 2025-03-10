const express = require('express');
const RoomService = require('../services/rooms.service');
const router = express.Router();
const service = new RoomService();
const validatorHandler = require('../midlewares/validator.handler');
const { jwtAuth } = require('../midlewares/auth.handler');
const {
  createRoomSchema,
  getRoomSchema,
  updateRoomSchema,
  getRoomByNameSchema,
  addUserSchema,
} = require('./../schemas/room.schema');

router.get('/', jwtAuth('headers'), async (req, res) => {
  const rooms = await service.find();
  res.json(rooms);
});

router.get(
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getRoomSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const room = await service.findOne(id);
      res.json(room);
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
router.get('/archive/export/:year', jwtAuth('headers'), async (req, res) => {
  const { year } = req.params;
  const rooms = await service.exportResultsToMongo(year);
  res.json(rooms);
}
);

router.get('/generateRoomToken/:id', jwtAuth('headers'), async (req, res) => {
  const { id } = req.params;
  const token = await service.generateRoomToken(id);
  res.json(token);
}
);

router.post('/verifyRoomToken', jwtAuth('headers'),
  async (req, res, next) => {
    try {
      const token = req.body?.token;
      const roomId = await service.verifyRoomToken(token);
      res.status(200).json({id: roomId});
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
  '/add-user',
  jwtAuth('headers'),
  validatorHandler(addUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const rta = await service.addUser(body);
      res.status(201).json(rta);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/remove-user',
  jwtAuth('headers'),
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
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getRoomSchema, 'params'),
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
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getRoomSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await service.delete(id);
      res.json(deleted);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
