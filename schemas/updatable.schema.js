const Joi = require('joi');

const updatable = Joi.boolean();
const updatable_user = Joi.boolean();
const updatable_password = Joi.string();
const refresh_enabled = Joi.boolean();
const last_updated_year = Joi.number();

const updateAvailableSchema = Joi.object({
  updatable: updatable,
  updatable_user: updatable_user,
  master_password: updatable_password,
  refresh_enabled: refresh_enabled,
  last_updated_year: last_updated_year
});

module.exports = {
  updateAvailableSchema,
};
