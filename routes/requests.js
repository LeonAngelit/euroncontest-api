const express = require('express');
const RequestService = require('../services/requests.service');
const router = express.Router();
const service = new RequestService();
const { jwtAuth } = require('../midlewares/auth.handler');


router.post('/addRequest', jwtAuth('headers'),
  async (req, res, next) => {
    try {
      const body = req.body;
      if (!(["image_to_video","upscale", "clean"].includes(body.model)) || !body.imgPath) {
        return res.status(400).json({ error: "You must provide a valid body" })
      } else {
        const newRequest = await service.create(body);
        if (newRequest == 1) {
         return res.status(200).json({message: "Request created successfully"});
        } else {
        return res.status(500).json({ error: newRequest })
        }
      }

    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/',
  jwtAuth('headers'),
  async (req, res, next) => {
    try {
      const deleted = await service.delete();
    return res.json(deleted);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
