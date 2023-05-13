const Joi = require('joi');
const config = require('../config/config');

const regexPass = config.passwordRegex;
const userNameRegex = config.nombreUsuarioRegex;

const id = Joi.number();
const name = Joi.string().regex(userNameRegex);
const password = Joi.string().regex(regexPass);
const token = Joi.string().min(8);
const winnerOption = Joi.boolean();
const selection = Joi.array();
const color = Joi.string();

const createUserSchema = Joi.object({
  username: name.required(),
  password: password.required(),
});

const updateUserSchema = Joi.object({
  username: name,
  password: password,
  token: token,
  color: color,
});

const getUserSchema = Joi.object({
  id: id.required(),
});

const getUserByNameSchema = Joi.object({
  name: name.required(),
});

const addCountrySchema = Joi.object({
  userId: id.required(),
  countryId: id.required(),
  winnerOption: winnerOption,
});

const bulkAddCountrySchema = Joi.object({
  userId: id.required(),
  selection: selection.required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  getUserByNameSchema,
  addCountrySchema,
  bulkAddCountrySchema,
};
