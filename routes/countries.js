const express = require("express");
const CountryService = require("../services/countries.service");
const router = express.Router();
const service = new CountryService();
const validatorHandler = require("../midlewares/validator.handler");
const { jwtAuth, jwtAuthAdminLevel } = require("../midlewares/auth.handler");
const {
	getCountrySchema,
	createCountrySchema,
	updateCountrySchema,
} = require("./../schemas/country.schema");

router.get("/", jwtAuth("headers"), async (req, res) => {
	const countries = await service.find();
	res.json(countries);
});

router.get(
	"/:id",
	jwtAuth("headers"),
	validatorHandler(getCountrySchema, "params"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const country = await service.findOne(id);
			res.json(country);
		} catch (error) {
			next(error);
		}
	}
);

router.get("/refresh/:year", jwtAuthAdminLevel("headers"), async (req, res, next) => {
	try {
		const { year } = req.params;
		const countries = await service.refresh(year);
		res.json(countries);
	} catch (error) {
		next(error);
	}
});

router.get("/getUpdate/:year", jwtAuth("headers"), async (req, res, next) => {
	try {
		const { year } = req.params;
		const countries = await service.getUpdate(year);
		res.json(countries);
	} catch (error) {
		next(error);
	}
});

router.get("/open/:year", jwtAuth("headers"), async (req, res, next) => {
	try {
		const { year } = req.params;
		const countries = await service.open(year);
		res.json(countries);
	} catch (error) {
		next(error);
	}
});

router.get("/updateLinks/:year", jwtAuthAdminLevel("headers"), async (req, res, next) => {
	try {
		const { year } = req.params;
		const countries = await service.updateLinks(year);
		res.json(countries);
	} catch (error) {
		next(error);
	}
});

router.post(
	"/",
	jwtAuthAdminLevel("headers"),
	validatorHandler(createCountrySchema, "body"),
	async (req, res, next) => {
		try {
			const body = req.body;
			const newCountry = await service.create(body);
			res.status(201).json(newCountry);
		} catch (error) {
			next(error);
		}
	}
);

router.put(
	"/:id",
	jwtAuth("headers"),
	validatorHandler(getCountrySchema, "params"),
	validatorHandler(updateCountrySchema, "body"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const body = req.body;
			const country = await service.update(id, body);
			res.json(country);
		} catch (error) {
			next(error);
		}
	}
);

router.patch(
	"/:id",
	jwtAuth("headers"),
	validatorHandler(getCountrySchema, "params"),
	validatorHandler(updateCountrySchema, "body"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const body = req.body;
			const country = await service.update(id, body);
			res.json(country);
		} catch (error) {
			next(error);
		}
	}
);

router.delete(
	"/:id",
	jwtAuth("headers"),
	validatorHandler(getCountrySchema, "params"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const deleted = await service.delete(id);
			res.json(deleted);
		} catch (error) {
			next(error);
		}
	}
);

module.exports = router;
