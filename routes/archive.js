const express = require("express");
const ArchiveService = require("../services/archive.service");
const router = express.Router();
const service = new ArchiveService();
const { jwtAuth } = require("../midlewares/auth.handler");

router.get("/", jwtAuth("headers"), async (req, res) => {
	const rooms = await service.find();
	res.json(rooms);
});

router.get(
	"/:id",
	jwtAuth("headers"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const room = await service.findOne(id);
			res.json(room);
		} catch (error) {
			next(error);
		}
	}
);

router.get("/users/:userName", jwtAuth("headers"), async (req, res, next) => {
	try {
		const { userName } = req.params;
	const rooms = await service.findByUserName(userName);
	res.json(rooms);
	} catch (error) {
		next(error);
	}
});
	

module.exports = router;
