const express = require("express");
const ArchiveService = require("../services/archive.service");
const router = express.Router();
const service = new ArchiveService();
const UserService = require("../services/users.service");
const userService = new UserService();
const { jwtAuthHighLevel, jwtAuthAdminLevel } = require("../midlewares/auth.handler");


router.get("/", jwtAuthAdminLevel("headers"), async (req, res) => {
	const rooms = await service.find();
	res.json(rooms);
});


router.get("/users/:id", jwtAuthHighLevel("headers", "params"), async (req, res, next) => {
	try {
		const { id } = req.params;
	const user = userService.findOne(id);
	const rooms = await service.findByUserName(user.username);
	res.json(rooms);
	} catch (error) {
		next(error);
	}
});
	

module.exports = router;
