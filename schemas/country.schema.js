const Joi = require('joi');

const id = Joi.number().integer();
const name = Joi.string().min(3).max(15);
const code = Joi.string().max(2);
const points = Joi.number().integer();
const song = Joi.string();
const link = Joi.string();
const position = Joi.number().integer();

const createCountrySchema = Joi.object({
  name: name.required(),
  code: code.required(),
  points: points.required(),
  song: song,
  link: link,
  position: position,
});

const updateCountrySchema = Joi.object({
  name: name.required(),
  code: code,
  points: points.required(),
  song: song,
  link: link,
  position: position,
});

const getCountrySchema = Joi.object({
  id: id.required(),
});

module.exports = {
  createCountrySchema,
  updateCountrySchema,
  getCountrySchema,
};
