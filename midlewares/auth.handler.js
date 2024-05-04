const boom = require("@hapi/boom");
const jwt = require("jsonwebtoken");
const conf = require("../config/config");
const bcrypt = require("bcrypt");
const config = require("../config/config");

function jwtAuth(property) {
	return (req, res, next) => {
		const data = req[property].bearer;
		console.log(data);
		console.log(conf.pkey);
		jwt.verify(data, conf.pkey, function (err, decoded) {
			if (err) {
				next(boom.unauthorized("bla"));
			}
			if (!(decoded.auth == `${conf.authp}`)) {
				next(boom.unauthorized("bla bla"));
			}
		});
		next();
	};
}

function headerAuth(property) {
	return (req, res, next) => {
		const data = req[property].authorization;
		if (!bcrypt.compareSync(config.authp, data)) {
			next(boom.unauthorized("bla bla bla"));
		}
		next();
	};
}

module.exports = { jwtAuth, headerAuth };
