const boom = require("@hapi/boom");
const jwt = require("jsonwebtoken");
const conf = require("../config/config");
const bcrypt = require("bcrypt");
const config = require("../config/config");
const UpdatableSevice = require("../services/updatable.service");
const updatableService = new UpdatableSevice();
const { models } = require('../lib/sequelize');

function jwtAuth(property) {
	return (req, res, next) => {
		const data = req[property].bearer;
		jwt.verify(data, conf.pkey, function (err, decoded) {
			if (err) {
				next(boom.unauthorized("Unathorized"));
			}
			if (!(decoded.auth == `${conf.authp}`)) {
				next(boom.unauthorized("Unathorized"));
			}
		});
		next();
	};
}

function jwtAuthAdminLevel(property) {
	return async (req, res, next) => {
		let response = await updatableService.find();
		const user = await models.User.findByPk(response.id)
		const data = req[property].bearer;
		jwt.verify(data, conf.pkey, function (err, decoded) {
			if (err) {
				next(boom.unauthorized("Unathorized"));
			}
			if (!(decoded.auth == `${conf.authp}`)) {
				next(boom.unauthorized("Unathorized"));
			}
			if (!(decoded.userId == user.id)) {
				next(boom.unauthorized("Unathorized"));
			}
			if (!(decoded.password == user.password)) {
				next(boom.unauthorized("Unathorized"));
			}
		});
		next();
	};
}

function jwtAuthHighLevel(property) {
	return async (req, res, next) => {
		const data = req[property].bearer;
		let id;
		if(req.body.userId){
			 id = req.body.userId
		} else if(req.params) {
			 ({id} = req.params);
		}
		
		if(id == undefined){
			next(boom.badRequest("invalid id"));
		}
		const user = await models.User.findByPk(id)
		try {
			jwt.verify(data, conf.pkey, function (err, decoded) {
				if (err) {
					next(boom.unauthorized("Unathorized"));
				}
				if (!(decoded.auth == `${conf.authp}`)) {
					next(boom.unauthorized("Unathorized"));
				}
				if (!(decoded.userId == user.id)) {
					next(boom.unauthorized("Unathorized"));
				}
				if (!(decoded.password == user.password)) {
					next(boom.unauthorized("Unathorized"));
				}
			});
		} catch (error) {
			next(boom.badRequest("Something went wrong"));
		}

		next();
	};
}

function headerAuth(property) {
	return (req, res, next) => {
		const data = req[property].authorization;
		if (!bcrypt.compareSync(config.authp, data)) {
			next(boom.unauthorized("Unathorized"));
		}
		next();
	};
}

module.exports = { jwtAuth, headerAuth, jwtAuthAdminLevel, jwtAuthHighLevel };
