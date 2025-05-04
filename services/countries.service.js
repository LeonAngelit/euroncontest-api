const boom = require("@hapi/boom");
const { models } = require("../lib/sequelize");
const PuppeteerService = require("../utils/puppeteer.util");
const UpdatableService = require("./updatable.service");
const UserService = require("./users.service");
const RoomsService = require("./rooms.service");
const EmailService = require('../utils/email.util');
const emailService = new EmailService();
const userService = new UserService();
const updatableService = new UpdatableService();
const findService = new PuppeteerService();
const roomsService = new RoomsService();
const axios = require("axios");

class CountryService {
	constructor() {
		this.findService = findService;
	}

	async create(data) {
		const newCountry = await models.Country.create(data);
		return newCountry;
	}

	async find() {
		const countries = await models.Country.findAll();
		return countries;
	}

	async findOne(id) {
		const country = await models.Country.findByPk(id);
		if (!country) {
			throw boom.notFound("Product not found");
		}
		return country;
	}

	async findOneByName(name) {
		const country = await models.Country.findOne({ where: { name: name } });
		if (!country) {
			throw boom.notFound("Product not found");
		}
		return country;
	}

	async update(id, data) {
		const country = await this.findOne(id);
		const rta = await country.update(data);
		return rta;
	}

	async updateByName(name, data) {
		const country = await this.findOneByName(name);
		const rta = await country.update(data);
		return rta;
	}

	async delete(id) {
		const country = await this.findOne(id);
		country.destroy();
		return { id };
	}

	async initialize(year) {
		await models.Country.truncate();
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${(year - process.env.FIRST_YEAR) * 10 +
			parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const findResponse = await findService.find(url);
		const countries = findResponse.countries;
		for (let i = 0; i < countries.length; i++) {
			await this.create(countries[i]);
		}
	}

	async getUpdate(year) {
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${(year - process.env.FIRST_YEAR) * 10 +
			parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const findResponse = await findService.find(url);
		const countries = findResponse.countries;
		return countries;
	}

	async open(year) {
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${(year - process.env.FIRST_YEAR) * 10 +
			parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		await findService.open(url);
		return 200;
	}

	async refresh(year) {
		const lastUpdatedYear = await updatableService.find();
		if (!lastUpdatedYear.refresh_enabled) {
			throw boom.forbidden("No points refresh available")
		}
		let resetNeeded = lastUpdatedYear.last_updated_year != parseInt(year);
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url = process.env.BASE_URL + `${(year - process.env.FIRST_YEAR) * 10 + parseInt(process.env.FIRST_YEAR_SCRIPT)}.js`;
		if (resetNeeded) {
			await models.Country.truncate({ restartIdentity: true, cascade: true });
		}
		const findResponse = await findService.find(url);
		let countries = findResponse.countries;
		let winner = findResponse.winner;
		for (let i = 0; i < countries.length; i++) {
			try {
				const countryTemp = await this.findOneByName(countries[i].name);
				this.update(countryTemp.id, {
					position: countries[i].position,
					points: countries[i].points,
					song: countries[i].song,
				});
			} catch (error) {
				this.create(countries[i]);
			}
		}
		if (resetNeeded) {
			await this.updateLinks(year);
			await updatableService.set({ last_updated_year: parseInt(year) });
		}
		const users = await userService.find();
		for (const user of users) {
			let totalPoints = 0;
			for (const country of user.countries) {
				if (country.id === user.winnerOption[0].countryId) {
					totalPoints += parseInt(country.points + (country.points * 0.1));
				} else {
					totalPoints += parseInt(country.points);
				}
			}
			await user.update({ points: totalPoints });
		}

		if (winner == null) {
			const rooms = await roomsService.find();
			for (const room of rooms) {
				let data = room.users[0].dataValues;
				const today = new Date();
				const formatted = new Intl.DateTimeFormat('en-GB').format(today);
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
					if (country.id == data.winnerOption[0].dataValues.countryId) {
						baseString += ' - opción ganadora'
					}
					formattedCountries.push(baseString);
				})
				const response = await axios.post("https://certificate-generate-3jth.onrender.com/generate-pdf", {
					name: `${data.username}`,
					score: `${data.points}`,
					date: `${formatted}`,
					countries: formattedCountries,
				}, {
					responseType: "arraybuffer"
				},);
				if (response.status == 200) {
					const pdfBuffer = Buffer.from(response.data);
					try {
						await this.sendWinnerEmail(pdfBuffer, data.username, room.name, "leonangelitg@gmail.com");
					} catch (error) {
						throw boom.gatewayTimeout("Error sending email: " + error.toString())
					}

					updatableService.set({ refresh_enabled: false });
				}
			}
			return { message: "Winner emails sent" }
		}
		return countries;
	}

	async updateLinks(year) {
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${(year - process.env.FIRST_YEAR) * 10 +
			parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const findResponse = await findService.find(url);
		const countries = findResponse.countries;
		const links = await findService.findLinks(
			process.env.URL_VIDEOS,
			countries
		);
		for (let i = 0; i < countries.length; i++) {
			try {
				const countryTemp = await this.findOneByName(countries[i].name);
				this.updateByName(countryTemp.name, {
					link: links[countries[i].name],
				});
			} catch (error) {
				return error.message
			}
		}
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

module.exports = CountryService;
