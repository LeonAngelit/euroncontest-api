const Joi = require('joi');

const id = Joi.number().integer();
const name = Joi.string().min(3).max(30);
const password = Joi.string().min(8);

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
  id: id.required(),
});

const getRoomByNameSchema = Joi.object({
  name: name.required(),
});

const addUserSchema = Joi.object({
  roomId: id.required(),
  userId: id.required(),
});

module.exports = {
  createRoomSchema,
  updateRoomSchema,
  getRoomSchema,
  getRoomByNameSchema,
  addUserSchema,
};
