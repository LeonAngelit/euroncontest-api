const express = require('express');
const RoomService = require('../services/rooms.service');
const CountryService = require('../services/countries.service');
const router = express.Router();
const service = new RoomService();
const cService = new CountryService();
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
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  async function find() {
    await cService.refresh('2023');
    const room = await service.findOne(id);
    res.write(`data: ${JSON.stringify(room)}\n\n`);
  }

  const { id } = req.params;
  const interval = setInterval(() => {
    /* const data = service.findOne(id); // your function to get data from the database
    res.write(`data: ${JSON.stringify(data)}\n\n`);*/
    find();
  }, 90000);

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
