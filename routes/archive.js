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


router.get(
	"/room/:roomId/:id",
	jwtAuthHighLevel("headers"),
	async (req, res, next) => {
		try {
			const { roomId, id } = req.params;
			const room = await service.findOne(roomId);
			const filteredUsers = room.room.users.filter(user => user.id == id);
			if(filteredUsers.length > 0){
				res.json(room);
			} else {
				res.status(403).json({
					message: "User not autorized to see this room"
				})
			}
			
		} catch (error) {
			next(error);
		}
	}
);


router.get("/users/:id", jwtAuthHighLevel("headers"), async (req, res, next) => {
	try {
		const { id } = req.params;
	const user = await userService.findOne(id);
	const rooms = await service.findByUserName(user.username);
	res.json(rooms);
	} catch (error) {
		next(error);
	}
});
	

module.exports = router;
