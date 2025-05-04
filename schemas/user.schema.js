const Joi = require('joi');
const config = require('../config/config');

const regexPass = config.passwordRegex;
const userNameRegex = config.nombreUsuarioRegex;
const emailRegex = config.emailRegex

const id = Joi.number();
const name = Joi.alternatives().try(
  Joi.string().pattern(userNameRegex),
  Joi.string().pattern(emailRegex)
);
const password = Joi.string().regex(regexPass);
const token = Joi.string().min(8);
const image = Joi.string();
const winnerOption = Joi.boolean();
const selection = Joi.array();
const color = Joi.string();
const email = Joi.string().email();

const createUserSchema = Joi.object({
  username: name.required(),
  password: password.required(),
  email: email.required()
});

const updateUserSchema = Joi.object({
  username: name,
  password: password,
  token: token,
  color: color,
  image: image,
  email: email,
});

const getUserSchema = Joi.object({
  id: id.required(),
});

const getUserByNameSchema = Joi.object({
  name: name.required(),
  password: password.required()
});

const googleLoginSchema = Joi.object({
  clientId: Joi.string(),
  credential: Joi.string().required(),
  select_by: Joi.string(),
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
  googleLoginSchema
};
