const sequelize = require('sequelize');
const { models } = require('../lib/sequelize');
const config = require('../config/config');

class UpdatableSevice {
  constructor() {}

  async create(data) {
    const newUpdatable = await models.Updatable.create(data);
    return newUpdatable;
  }

  async find() {
    const updatable = await models.Updatable.findAll();
    return updatable[0];
  }

  async initialize() {
    const data = {
      updatable: true,
      updatable_user: true,
      master_password: config.authp,
      refresh_enabled:true,
      last_updated_year: new Date().getFullYear(),
    };
    const updatable = await this.create(data, {
      exclude: ['master_password'],
    });
    return updatable;
  }

  async set(available) {
    const updatable = await models.Updatable.findAll();
    const rta = await updatable[0].update(available);
    return rta;
  }

  async block(block) {
    let query;
    if (block.updatable == false) {
      const users = await models.User.find();
      query = `ALTER TABLE users ADD CONSTRAINT max_rows CHECK (SELECT count(*) FROM users <= ${users.length};`;
    } else if (block.updatable == true) {
      query = `ALTER TABLE users DROP CONSTRAINT max_rows;`;
    }

    let rta = await sequelize
      .query(query)
      .then(() => {
        return rta;
      })
      .catch((error) => {
        throw error;
      });
  }
}

module.exports = UpdatableSevice;
