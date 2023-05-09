const express = require('express');
const UpdatableService = require('../services/updatable.service');
const router = express.Router();
const service = new UpdatableService();
const validatorHandler = require('../midlewares/validator.handler');
const { jwtAuth } = require('../midlewares/auth.handler');
const { updateAvailableSchema } = require('./../schemas/updatable.schema');

router.get('/', async (req, res) => {
  const updatable = await service.find();
  res.json(updatable);
});

router.put(
  '/',
  jwtAuth('headers'),
  validatorHandler(updateAvailableSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newStatus = await service.set(body);
      res.status(200).json(newStatus);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/users',
  jwtAuth('headers'),
  validatorHandler(updateAvailableSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newStatus = await service.block(body);
      res.status(200).json(newStatus);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
