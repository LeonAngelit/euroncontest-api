const express = require('express');
const UserService = require('./../services/users.service');
const router = express.Router();
const service = new UserService();
const validatorHandler = require('./../midlewares/validator.handler');
const { jwtAuth } = require('../midlewares/auth.handler');
const multer = require("multer");
const {
  createUserSchema,
  getUserSchema,
  updateUserSchema,
  getUserByNameSchema,
  addCountrySchema,
  bulkAddCountrySchema,
} = require('./../schemas/user.schema');
const upload = multer({ storage: multer.memoryStorage() });
const config = require('../config/config')

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
  '/validateEmailSent/:id',
  jwtAuth('headers'),
  validatorHandler(getUserSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const response = await service.isEmailSent(id);
      res.json({
        emailSent: response
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/validateToken/:id',
  jwtAuth('headers'),
  validatorHandler(getUserSchema, 'params'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const response = await service.validateToken(id);
      res.json({
        isValidToken: response
      });
    } catch (error) {
      next(error);
    }
  }
);


router.post(
  '/login',
  jwtAuth('headers'),
  validatorHandler(getUserByNameSchema, 'params'),
  async (req, res, next) => {
    try {
      const body = req.body;
      if(config.emailRegex.test(body.name)){
        user = await service.loginByEmail(body.name, body.password);
        res.json(user);
      } else if(config.nombreUsuarioRegex.test(body.name)){
        user = await service.loginByName(body.name, body.password);
        res.json(user);
      } else {
        res.status(400).json({
          error: "Nombre de usuario incorrecto"
        })
      }
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/signup',
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
  upload.single('image'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.file ?? req.body;
      let user;

      if (req.file) {
        user = await service.updateImage(id, body);
      } else {
        user = await service.update(id, body);
      }
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
  upload.single('image'),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const body = req.body;
      let user;
      if (req.file) {
        user = await service.updateImage(id, req.file);
      } else {
        user = await service.update(id, body);
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.post('/updateUserEmail', jwtAuth('headers'),
  async (req, res, next) => {
    try {
      if (req.body?.token) {
        const token = req.body?.token;
        const userId = await service.updateEmail(token);
        res.status(200).json({ id: userId });
      } else {
        res.status(400).json({ error: "Request body is not correct" })
      }

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
