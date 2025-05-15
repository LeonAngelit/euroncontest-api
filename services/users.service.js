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
const { OAuth2Client } = require('google-auth-library');
const axios = require("axios");


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
    data.token = Date.now().toString();
    let newUser = await models.User.create(data);
    const token = jsonwebtoken.sign({ userId: newUser.id, email: tempEmail }, pkey, { expiresIn: "1h" });
    try {
      await this.sendEmail(token, tempEmail);
    } catch (error) {
      throw boom.gatewayTimeout("Error sending email: " + error.toString())
    }
    let email_sent = Date.now().toString();
    user = await newUser.update({
      email_sent: email_sent
    });
    const highLevelToken = jsonwebtoken.sign({ userId: newUser.id, password: newUser.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
    user = await this.findOne(newUser.id);
    return { user: user, token: highLevelToken }
  }

  async accessWithGoogle(data) {
    const client = new OAuth2Client(config.driveId);
    const credential = data.credential;

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.driveId,
      });
      const payload = ticket.getPayload();
      const { sub, email, name, picture } = payload;
      let user = await models.User.findOne({
        where: { email: email },
      });
      if (!user) {
        let normalizedName = name.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replaceAll(/['"`]/g, "")
          .replaceAll(" ", "")

        const salt = bcrypt.genSaltSync(12);
        const pass = bcrypt.hashSync(sub + normalizedName + config.authp, salt, null);
        let newUserData = {
          username: email.split("@")[0],
          password: pass,
          email: email,
          sub: sub,
          image: picture,
          token: Date.now().toString()
        }
        let newUser = await models.User.create(newUserData);
        const highLevelToken = jsonwebtoken.sign({ userId: newUser.id, password: newUser.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
        user = await this.findOne(newUser.id);
        return { user: user, token: highLevelToken }
      } else {

        if (user.sub == null) {
          let subData = {
            sub: sub,
            token: Date.now()
          }
          await this.update(user.id, subData);
          const highLevelToken = jsonwebtoken.sign({ userId: user.id, password: user.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
          user = await this.findOne(newUser.id);
          return { user: user, token: highLevelToken }
        } else {
          if (user.sub != sub) {
            throw boom.unauthorized('Invalid Google token')
          }
          const rta = await user.update({
            token: Date.now()
          });
          const highLevelToken = jsonwebtoken.sign({ userId: user.id, password: user.password, auth: `${config.authp}` }, config.pkey, { expiresIn: "24h" });
          user = await this.findOne(user.id);
          return { user: user, token: highLevelToken }
        }
      }
    }
    catch (err) {
      throw boom.unauthorized('There was an error during process')
    }
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
      try {
        this.sendEmail(token, data.email);
      } catch (error) {
        throw boom.gatewayTimeout("Error sending email: " + error.toString())
      }

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

  async sendWinnerCertificate(data) {
    const formatted = new Intl.DateTimeFormat('en-GB').format(new Date());
    let formattedCountries = [];
    let countries = data.countries.map(country => {
      return {
        id: country.id,
        name: country.name,
        position: country.position,
        points: country.points
      }
    });
    countries.sort((a, b) => a.position - b.position);
    countries.forEach(country => {
      let baseString = `${country.name}: ${country.points} puntos`
      if (country.position == 1) {
        baseString += ' - país ganador'
      }
      if (country.id == data.winnerOption[0].countryId) {
        baseString += ' - opción ganadora'
      }
      formattedCountries.push(baseString);
    })
    try {
      const response = await axios.post("https://certificate-generate-3jth.onrender.com/generate-pdf", {
        name: ` ${data.username} `,
        score: `${data.points}`,
        date: ` ${formatted} `,
        countries: formattedCountries,
      }, {
        responseType: "arraybuffer"
      },);
      if (response.status == 200) {
        const pdfBuffer = Buffer.from(response.data);
        try {
          await this.sendWinnerEmail(pdfBuffer, data.username, data.room, data.email);

        } catch (error) {
          throw boom.gatewayTimeout("Error sending email: " + error.toString())
        }
        return { message: "Winner email sent" }
      }
    } catch (error) {
      throw boom.gatewayTimeout("Error sending email: " + error.toString())
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

  async sendWinnerEmail(filePath, user, roomName, emailReceiver) {
    const htmlEmailBody = `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Confirma tu email</title>
		</head>
		
		<body>
			<p>
				Enhorabuena ${user}! Aquí tienes tu certificado por haber ganado en la sala ${roomName}
			</p>
			<p>
				Muchas gracias por haber participado!
			</p>
		</body>
		</html>`
    let data = {
      name: "no-reply@eurocontest", // sender address
      subject: `Enhorabuena! 🎉`, // Subject line
      htmlBody: htmlEmailBody,
      attachments: [
        {
          filename: `diploma_${user}.pdf`,
          content: filePath,
          contentType: "application/pdf",
        },
      ],// html body
    }
    const response = await emailService.sendCongratsEmail(data, emailReceiver)
    if (response == 1) {
      return response
    } else {
      throw boom.badData({
        message: response
      })
    }
  }
}

module.exports = UserService;
