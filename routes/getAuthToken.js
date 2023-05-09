const express = require('express');
const router = express.Router();
const { headerAuth } = require('../midlewares/auth.handler');
const jsonwebtoken = require('jsonwebtoken');
const config = require('../config/config');

router.get('/', headerAuth('headers'), async (req, res) => {
  const bearer = jsonwebtoken.sign(
    { auth: `${config.authp}` },
    `${config.pkey}`,
    {
      expiresIn: '20m',
    }
  );
  res.json(bearer);
});

module.exports = router;
