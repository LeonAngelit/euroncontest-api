const boom = require('@hapi/boom');
const { models } = require('./../lib/sequelize');

class UserService {
  constructor() {
    this.users = [];
  }

  async create(data) {
    const isUpdatable = await models.Updatable.findByPk(1);
    if (!isUpdatable.updatable_user) {
      throw boom.unauthorized('Actualmente no se pueden crear más usuarios');
    }

    const newUser = await models.User.create(data);
    return newUser;
  }

  async bulkAddCountry(data) {
    let response = [];
    let temp;
    for (let i = 0; i < data.selection.length; i++) {
      if (i == 0) {
        temp = await this.addCountry({
          userId: data.userId,
          countryId: data.selection[i],
          winnerOption: true,
        });
      } else {
        temp = await this.addCountry({
          userId: data.userId,
          countryId: data.selection[i],
        });
      }
      response.push(temp);
    }

    return response;
  }

  async addCountry(data) {
    let isUserCountryAdded;
    let response;
    const userCountryAdded = await models.UserCountry.findAll({
      where: { userId: data.userId },
    });
    isUserCountryAdded = userCountryAdded.length >= 5;
    const isUpdatable = await models.Updatable.findByPk(1);
    if (isUserCountryAdded && !isUpdatable.updatable) {
      throw boom.unauthorized(
        'Actualmente no se pueden actualizar las opciones, mucha suerte!'
      );
    } else {
      if (isUserCountryAdded) {
        await models.UserCountry.destroy({
          where: { userId: data.userId },
        });
      }

      try {
        if (data.winnerOption) {
          const winnerOption = await models.UserCountry.findOne({
            where: {
              userId: data.userId,
              winnerOption: true,
            },
          });
          if (winnerOption) {
            throw boom.unauthorized(
              'No se puede tener más de una opción ganadora'
            );
          }
        }
        const newUserCountry = await models.UserCountry.create(data);
        const user = await models.User.findByPk(newUserCountry.userId, {
          attributes: { exclude: ['password'] },
        });
        const country = await models.Country.findByPk(
          newUserCountry.countryId,
          {
            through: {
              attributes: [], // exclude the join table columns
            },
            attributes: {
              exclude: ['link'],
            },
          }
        );
        response = {
          user,
          country,
        };
      } catch (error) {
        return error;
      }
    }

    return response;
  }

  async find() {
    const rta = await models.User.findAll({
      include: [
        {
          model: models.Country,
          as: 'countries',
          through: {
            attributes: [], // exclude the join table columns
          },
          attributes: { exclude: ['link'] },
        },
      ],
      attributes: { exclude: ['password'] },
    });
    return rta;
  }

  async findOne(id) {
    const user = await models.User.findByPk(id, {
      include: [
        {
          model: models.Country,
          as: 'countries',
          through: {
            attributes: [], // exclude the join table columns
          },
          attributes: {
            exclude: ['link', 'code', 'song', 'position', 'points'],
          },
        },
        {
          model: models.Room,
          as: 'rooms',
          through: {
            attributes: [], // exclude the join table columns
          },
          include: [
            {
              model: models.User,
              as: 'users',
              through: {
                attributes: [], // exclude the join table columns
              },
              include: [
                {
                  model: models.Country,
                  as: 'countries',
                  attributes: { exclude: ['link'] },
                },
              ],
              attributes: { exclude: ['password', 'token'] },
            },
          ],
          attributes: { exclude: ['password'] },
        },
      ],
      attributes: { exclude: ['password', 'color', 'image'] },
    });
    if (!user) {
      throw boom.notFound('User not found');
    }

    return user;
  }

  async findOneByName(name) {
    const user = await models.User.findOne({
      where: { username: name },
      include: [
        {
          model: models.Country,
          as: 'countries',
          through: {
            attributes: [], // exclude the join table columns
          },
          attributes: { exclude: ['link'] },
        },
        {
          model: models.Room,
          as: 'rooms',
          through: {
            attributes: [], // exclude the join table columns
          },
          include: [
            {
              model: models.User,
              as: 'users',
              through: {
                attributes: [], // exclude the join table columns
              },
              include: [
                {
                  model: models.Country,
                  as: 'countries',
                  attributes: { exclude: ['link'] },
                },
              ],
              attributes: { exclude: ['password', 'token'] },
            },
          ],
          attributes: { exclude: ['password'] },
        },
      ],
    });

    if (!user) {
      throw boom.notFound('User not found');
    }

    return user;
  }

  async update(id, data) {
    const user = await models.User.findOne({ where: { id: id } });
    const rta = await user.update(data);
    return rta;
  }

  async delete(id) {
    const user = await this.findOne(id);
    user.destroy();
    return { id };
  }
}

module.exports = UserService;
