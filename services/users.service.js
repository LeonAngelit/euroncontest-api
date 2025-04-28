const boom = require('@hapi/boom');
const { models } = require('./../lib/sequelize');
const { pkey } = require('../config/config');
const ImagesService = require('./images.service');
const EmailService = require('../utils/email.util');
const emailService = new EmailService();
const imagesService = new ImagesService();
const jsonwebtoken = require('jsonwebtoken');
const config = require('../config/config');
const bcrypt = require("bcrypt");

class UserService {
  constructor() {
    this.users = [];
  }

  async create(data) {
    const isUpdatable = await models.Updatable.findByPk(1);
    if (!isUpdatable.updatable_user) {
      throw boom.unauthorized('Actualmente no se pueden crear más usuarios');
    }
    let tempEmail = data.email;
    data.email = '';
    data.email_sent = Date.now().toString();
    const newUser = await models.User.create(data);
    const token = jsonwebtoken.sign({ userId: newUser.id, email: tempEmail }, pkey, { expiresIn: "1h" });
    this.sendEmail(token, tempEmail);
    return newUser;
  }

  async bulkAddCountry(data) {
    let response = [];
    let temp;
    await models.UserCountry.destroy({
      where: { userId: data.userId },
    });
    if (data.selection.length == 5) {
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
      if (response.length == 5) {
        return response;
      } else {
        throw boom.expectationFailed(
          'No se han procesado los 5 países elegidos'
        );
      }
    } else {
      throw boom.badRequest('No se han procesado los 5 países elegidos');
    }
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
          attributes: { exclude: ['password', 'token', 'email_sent'] },
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
        await user.update({
          points: user.points += country.points,
        })
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
        {
          model: models.UserCountry,
          as: 'winnerOption',
          where: { winnerOption: true },
          attributes: { exclude: ['id', 'userId', 'winnerOption'] },
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
              attributes: { exclude: ['password', 'token', 'email_sent'] },
            },
          ],
          attributes: { exclude: ['password'] },
        },
      ],
      attributes: { exclude: ['password', 'token', 'email_sent'] },
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
              attributes: { exclude: ['password', 'token', 'email_sent'] },
            },
          ],
          attributes: { exclude: ['password', 'token', 'email_sent'] },
        },
      ],
    });

    if (!user) {
      throw boom.notFound('User not found');
    }

    return user;
  }

  async findOneByEmail(email) {
    const user = await models.User.findOne({
      where: { email: email },
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
              attributes: { exclude: ['password', 'token', 'email_sent'] },
            },
          ],
          attributes: { exclude: ['password', 'token', 'email_sent'] },
        },
      ],
    });

    if (!user) {
      throw boom.notFound('User not found');
    }

    return user;
  }

  async loginByEmail(email, password) {
    let user = await models.User.findOne({
      where: { email: email },
    });

    if (!user) {
      throw boom.notFound('User not found');
    }


    if (bcrypt.compareSync(password.split('').reverse().join(''), user.password)) {
      await user.update({
        token: Date.now()
      });

      user = await models.User.findOne({
        where: { email: email },
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
                attributes: { exclude: ['password', 'token', 'email_sent'] },
              },
            ],
            attributes: { exclude: ['password', 'token', 'email_sent'] },
          },
        ],
      });

      return user;
    } else {
      throw boom.unauthorized('Incorrect username or password');
    }

  }

  async loginByName(name, password) {
    let user = await models.User.findOne({
      where: { username: name },
    });

    if (!user) {
      throw boom.notFound('User not found');
    }


    if (bcrypt.compareSync(password.split('').reverse().join(''), user.password)) {

      await user.update({
        token: Date.now()
      });

      user = await models.User.findOne({
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
                attributes: { exclude: ['password', 'token', 'email_sent'] },
              },
            ],
            attributes: { exclude: ['password', 'token', 'email_sent'] },
          },
        ],
      });


      return user;
    } else {
      throw boom.unauthorized('Incorrect username or password');
    }

  }

  async update(id, data) {
    const user = await models.User.findOne({ where: { id: id } });
    if (data.email && data.email != user.email) {
      const token = jsonwebtoken.sign({ userId: user.id, email: data.email }, pkey, { expiresIn: "1h" });
      this.sendEmail(token, data.email);
      data.email = user.email;
      data.email_sent = Date.now().toString();
    }
    const rta = await user.update(data);
    return this.findOne(rta.id);
  }

  async updateEmail(token) {
    const decoded = jsonwebtoken.verify(token, pkey);
    let data;
    if (decoded.email) {
      data = {
        email: decoded.email,
      }
    }
    if (decoded.userId) {
      const user = await models.User.findOne({ where: { id: decoded.userId } });
      const rta = await user.update(data);
      return this.findOne(rta.id);
    } else {
      throw boom.unauthorized('Invalid token');
    }
  }

  async sendEmail(token, emailReceiver) {
    const htmlEmailBody = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirma tu email</title>
</head>

<body>
    <p>
        Hola! Has solicitado actualizar tu dirección de email, para confirmar que es correcta, debes hacer clic en el
        enlace de abajo 👇, que te dirigirá a la aplicación
    </p>
    <a href="${config.confirmEmailUrl}${token}" target="_blank" rel="noopener noreferrer">Confirma tu email aquí</a>
    <p>
        Muchas gracias,
    </p>
    <p>
        Saludos y mucha suerte!
    </p>
</body>

</html>`
    let data = {
      name: "no-reply@eurocontest", // sender address
      subject: `Confirma tu email 🚀`, // Subject line
      htmlBody: htmlEmailBody, // html body
    }
    emailService.sendConfirmEmail(data, emailReceiver)
  }

  async isEmailSent(id) {
    const user = await this.findOne(id);
    if (user) {
      return (user.email_sent != null && ((Date.now() - context.user_logged?.email_sent) / 3600000) < 1);
    }
    return false;
  }

  async validateToken(id) {
    const user = await this.findOne(id);
    if (user) {
      return ((Date.now() - parseInt(user.token)) / 3600000) < 24
    }
    return false;
  }

  async updateImage(id, data) {
    const url = await imagesService.upload(data);
    const user = await models.User.findOne({ where: { id: id } });
    if (!url) {
      return boom.badRequest('No se ha podido subir la imagen');
    }
    const rta = await user.update({ image: url });
    return this.findOne(rta.id);

  }

  async delete(id) {
    const user = await this.findOne(id);
    user.destroy();
    return { id };
  }
}

module.exports = UserService;
