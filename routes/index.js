const usersRouter = require('./users');
const roomsRouter = require('./rooms');
const countriesRouter = require('./countries');
const getAuthToken = require('./getAuthToken');
const updatableRouter = require('./updatable');
const archiveRouter = require('./archive');
const requests = require('./requests')
const express = require('express');
const config = require('../config/config')

function routerAPI(app) {
  const router = express.Router();
  app.use('/api/eurocontest', router);
  router.use('/users', usersRouter);
  router.use('/rooms', roomsRouter);
  router.use('/archive', archiveRouter);
  router.use('/countries', countriesRouter);
  router.use('/updatable', updatableRouter);
  router.use('/getAuthToken', getAuthToken);
  router.use(config.requestsEndpoint,requests);
}

module.exports = routerAPI;
