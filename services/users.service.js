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

    let user = await models.User.findOne({
      where: { email: data.email }
    });
    if (user) {
      throw boom.conflict("Invalid email")
    }

    user = await models.User.findOne({
      where: { username: data.username }
    });

    if (user) {
      throw boom.conflict("Invalid username")
    }

    let tempEmail = data.email;
    data.email = null;
    let newUser = await models.User.create(data);
    const token = jsonwebtoken.sign({ userId: newUser.id, email: tempEmail }, pkey, { expiresIn: "1h" });
    await this.sendEmail(token, tempEmail);
    data.email_sent = Date.now().toString();
    data.token = Date.now().toString();
    const highLevelToken = jsonwebtoken.sign({ userId: newUser.id, password: data.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
    user = await this.findOne(newUser.id);
    return { user: user, token: highLevelToken }
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
      attributes: { exclude: ['password', 'email', 'email_sent', 'token'] },
    });

    /* const response = await axios.post("https://certificate-generate-3jth.onrender.com/generate-pdf", {
       name: "patata",
       score: "9999",
       date: "01/05/2025",
       countries: ["pais 1", "pais 2", "pais 3", "pais 4", "pais 5"],
     }, { responseType: "arraybuffer" });  // Ens
     const pdfPath = path.join(__dirname, "temp.pdf");
     fs.writeFileSync(pdfPath, response.data);
 
     await this.sendWinnerEmail(pdfPath, rta[0].username, "patata", "agleondev@gmail.com")*/

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
      const rta = await user.update({
        token: Date.now()
      });
      const token = jsonwebtoken.sign({ userId: rta.id, password: user.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
      user = await this.findOne(rta.id);
      return { user: user, token: token };
    } else {
      throw boom.unauthorized('Incorrect email or password');
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
      const rta = await user.update({
        token: Date.now()
      });
      const token = jsonwebtoken.sign({ userId: rta.id, password: user.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
      user = await this.findOne(rta.id);
      return { user: user, token: token };
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
    try {
      const decoded = jsonwebtoken.verify(token, pkey);

      if (!decoded.email || !decoded.userId) {
        throw boom.unauthorized('Invalid token');
      }

      let user = await models.User.findOne({
        where: { email: decoded.email }
      });

      if (user) {
        throw boom.conflict("Invalid email")
      }

      user = await models.User.findOne({ where: { id: decoded.userId } });
      if (!user) {
        throw boom.notFound('User not found');
      }

      const data = { email: decoded.email };
      const rta = await user.update(data);
      return this.findOne(rta.id);

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw boom.unauthorized('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw boom.unauthorized('Invalid token');
      }
      throw error; // rethrow other unexpected errors
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
    const response = await emailService.sendConfirmEmail(data, emailReceiver)
    if (response == 1) {
      return response
    } else {
      throw boom.badData({
        message: response
      })
    }
  }

  async isEmailSent(id) {
    const user = await models.User.findByPk(id);
    if (user) {
      return (((Date.now() - user?.email_sent) / 3600000) < 1);
    }
    return false;
  }

  async isEmailPresent(id) {
    const user = await models.User.findByPk(id);
    if (user) {
      return user.email != null;
    }
    return false;
  }

  async validateToken(id) {
    const user = await models.User.findByPk(id)
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
