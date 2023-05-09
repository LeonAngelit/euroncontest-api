const Joi = require('joi');

const updatable = Joi.boolean();
const updatable_user = Joi.boolean();
const updatable_password = Joi.string();

const updateAvailableSchema = Joi.object({
  updatable: updatable,
  updatable_user: updatable_user,
  master_password: updatable_password,
});

module.exports = {
  updateAvailableSchema,
};
