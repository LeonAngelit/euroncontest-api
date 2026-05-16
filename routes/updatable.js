const express = require('express');
const UpdatableService = require('../services/updatable.service');
const router = express.Router();
const service = new UpdatableService();
const validatorHandler = require('../middlewares/validator.handler');
const { jwtAuthAdminLevel } = require('../middlewares/auth.handler');
const { updateAvailableSchema } = require('./../schemas/updatable.schema');

router.get('/', jwtAuthAdminLevel('headers'), async (req, res) => {
  const updatable = await service.find();
  updatable.master_password = await updatable.master_password
    .split('')
    .reverse()
    .join('');
  res.json(updatable);
});

router.put(
  '/',
  jwtAuthAdminLevel('headers'),
  validatorHandler(updateAvailableSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newStatus = await service.set(body);
      res.status(200).json(newStatus);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/users',
  jwtAuthAdminLevel('headers'),
  validatorHandler(updateAvailableSchema, 'body'),
  async (req, res, next) => {
    try {
      const body = req.body;
      const newStatus = await service.block(body);
      res.status(200).json(newStatus);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
