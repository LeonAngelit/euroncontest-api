const config = require('../config/config');
const Joi = require('joi');

const regexPass = config.passwordRegex;
const regexRoomName = config.nombreUsuarioRegex;

const id = Joi.number().integer();
const name = Joi.string().regex(regexRoomName);
const password = Joi.string().regex(regexPass);

const createRoomSchema = Joi.object({
  name: name.required(),
  password: password.required(),
  adminId: id.required(),
});

const updateRoomSchema = Joi.object({
  name: name,
  password: password,
  adminId: id,
});

const getRoomSchema = Joi.object({
  roomId: id.required(),
  id: id.required(),
});

const getRoomByNameSchema = Joi.object({
  name: name.required(),
});

const addUserSchema = Joi.object({
  roomId: id,
  roomName: name.required(),
  password: password.required(),
  userId: id.required(),
});

module.exports = {
  createRoomSchema,
  updateRoomSchema,
  getRoomSchema,
  getRoomByNameSchema,
  addUserSchema,
};
