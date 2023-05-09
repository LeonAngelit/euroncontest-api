const express = require('express');
const UserService = require('./../services/users.service');
const router = express.Router();
const service = new UserService();
const validatorHandler = require('./../midlewares/validator.handler');
const { jwtAuth } = require('../midlewares/auth.handler');
const {
  createUserSchema,
  getUserSchema,
  updateUserSchema,
  getUserByNameSchema,
  addCountrySchema,
  bulkAddCountrySchema,
} = require('./../schemas/user.schema');

router.get('/', jwtAuth('headers'), async (req, res) => {
  const users = await service.find();
  res.json(users);
});

router.get(
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getUserSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await service.findOne(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/name/:name',
  jwtAuth('headers'),
  validatorHandler(getUserByNameSchema, 'params'),
  async (req, res, next) => {
    try {
      const { name } = req.params;
      const user = await service.findOneByName(name);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  jwtAuth('headers'),
  validatorHandler(createUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newUser = await service.create(body);
      res.status(201).json(newUser);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/add-country',
  jwtAuth('headers'),
  validatorHandler(addCountrySchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newCountry = await service.addCountry(body);
      res.status(201).json(newCountry);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/bulk/add-country',
  jwtAuth('headers'),
  validatorHandler(bulkAddCountrySchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newCountry = await service.bulkAddCountry(body);
      res.status(201).json(newCountry);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  validatorHandler(getUserSchema, 'params'),
  validatorHandler(updateUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const user = await service.update(id, body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getUserSchema, 'params'),
  validatorHandler(updateUserSchema, 'body'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const user = await service.update(id, body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  jwtAuth('headers'),
  validatorHandler(getUserSchema, 'params'),
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
