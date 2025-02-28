const usersRouter = require('./users');
const roomsRouter = require('./rooms');
const countriesRouter = require('./countries');
const getAuthToken = require('./getAuthToken');
const updatableRouter = require('./updatable');
const archiveRouter = require('./archive');
const express = require('express');

function routerAPI(app) {
  const router = express.Router();
  app.use('/api/eurocontest', router);
  router.use('/users', usersRouter);
  router.use('/rooms', roomsRouter);
  router.use('/archive', archiveRouter);
  router.use('/countries', countriesRouter);
  router.use('/updatable', updatableRouter);
  router.use('/getAuthToken', getAuthToken);
}

module.exports = routerAPI;
