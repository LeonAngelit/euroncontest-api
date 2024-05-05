const boom = require("@hapi/boom");
const { models } = require("../lib/sequelize");
const PuppeteerService = require("../utils/puppeteer.util");
const findService = new PuppeteerService();

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
			`${
				(year - process.env.FIRST_YEAR) * 10 +
				parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const countries = await findService.find(url);
		for (let i = 0; i < countries.length; i++) {
			await this.create(countries[i]);
		}
	}

	async refresh(year) {
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${
				(year - process.env.FIRST_YEAR) * 10 +
				parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const countries = await findService.find(url);
		for (let i = 0; i < countries.length; i++) {
			try {
				const countryTemp = await this.findOneByName(countries[i].name);
				this.update(countryTemp.id, {
					position: countries[i].position,
					points: countries[i].points,
				});
			} catch (error) {
				console.log(error);
			}
		}
	}

	async updateLinks(year) {
		let url;
		if (parseInt(year) < 2022) {
			throw boom.notFound("Year not found");
		}
		url =
			process.env.BASE_URL +
			`${
				(year - process.env.FIRST_YEAR) * 10 +
				parseInt(process.env.FIRST_YEAR_SCRIPT)
			}.js`;
		const countries = await findService.find(url);
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
				console.log(error);
			}
		}
	}
}

module.exports = CountryService;
