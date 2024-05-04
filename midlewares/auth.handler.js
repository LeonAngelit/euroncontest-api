const boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const conf = require('../config/config');
const bcrypt = require('bcrypt');
const config = require('../config/config');

function jwtAuth(property) {
  return (req, res, next) => {
    const data = req[property].bearer;

    jwt.verify(data, conf.pkey, function (err, decoded) {
      if (err) {
        next(boom.unauthorized('Unauthorized'));
      }
      if (!(decoded.auth == `${conf.authp}`)) {
        next(boom.unauthorized('Unauthorized'));
      }
    });
    next();
  };
}

function headerAuth(property) {
  return (req, res, next) => {
    const data = req[property].authorization;
    if (!bcrypt.compareSync(config.authp, data)) {
      next(boom.unauthorized('Unauthorized'));
    }
    next();
  };
}

module.exports = { jwtAuth, headerAuth };
